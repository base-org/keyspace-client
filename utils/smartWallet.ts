import { estimateUserOperationGas, getRequiredPrefund, UserOperation } from "permissionless";
import { Address, Chain, encodeAbiParameters, encodeFunctionData, fromHex, Hex, keccak256, PublicClient, toHex, Transport, UserRejectedRequestError } from "viem";
import { estimateFeesPerGas, getBytecode, readContract } from "viem/actions";
import { accountAbi, accountFactoryAbi, accountFactoryAddress, entryPointAbi, entryPointAddress } from "../generated";
import { buildDummySignature as buildDummySecp256k1 } from "./encodeSignatures/secp256k1";
import { buildDummySignature as buildDummyWebAuthn } from "./encodeSignatures/webAuthn";

export const PASSKEY_OWNER_DUMMY_SIGNATURE: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000170000000000000000000000000000000000000000000000000000000000000001949fc7c88032b9fcb5f6efc7a7b8c63668eae9871b765e23123bb473ff57aa831a7c0d9276168ebcc29f2875a0239cffdf2a9cd1c2007c5c77c071db9264df1d000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008a7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2273496a396e6164474850596759334b7156384f7a4a666c726275504b474f716d59576f4d57516869467773222c226f726967696e223a2268747470733a2f2f7369676e2e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d00000000000000000000000000000000000000000000";

export async function buildUserOp(
  client: PublicClient,
  {
    account,
    ksKey,
    ksKeyType,
    calls,
    paymasterAndData = "0x",
    signatureType,
  }: {
    account: Address;
    ksKey: Hex;
    ksKeyType: number;
    calls: Call[];
    paymasterAndData: Hex;
    signatureType: "secp256k1" | "webauthn";
  },
): Promise<UserOperation> {
  let initCode: Hex = "0x";
  const code = await getBytecode(client, { address: account });
  if (!code) {
    initCode = getInitCode({
      ksKey,
      ksKeyType,
      nonce: 0n,
    });
  }
  const callData = buildUserOperationCalldata({ calls });
  const nonce = await readContract(client, {
    address: entryPointAddress,
    abi: entryPointAbi,
    functionName: "getNonce",
    args: [account, 0n],
  });
  let maxFeesPerGas = await estimateFeesPerGas(client);

  const dummySigFunc = signatureType === "secp256k1" ? buildDummySecp256k1 : buildDummyWebAuthn;
  const signature = dummySigFunc();

  const op = {
    sender: account,
    nonce,
    initCode,
    callData,
    paymasterAndData,
    signature,
    preVerificationGas: 5_000_000n,
    verificationGasLimit: 1_000_000n,
    callGasLimit: 1_000_000n,
    ...maxFeesPerGas,
  };

  const requiredPrefund = getRequiredPrefund({
    userOperation: op,
  });
  const senderBalance = await client.getBalance({
    address: account,
  });
  if (senderBalance < requiredPrefund) {
    throw new Error(`Sender address does not have enough native tokens`)
  }

  // NOTE: The gas limits provided in the user operation seem to override any
  // estimated limits, which makes this estimate redundant.
  const gasLimits = await estimateUserOperationGas(client, {
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  return {
    ...op,
    ...gasLimits,
  };
}

export function getInitCode({ ksKey, ksKeyType, nonce }: { ksKey: Hex; ksKeyType: number; nonce: bigint }): Hex {
  return `${accountFactoryAddress}${
    createAccountCalldata({
      ksKey,
      ksKeyType,
      nonce,
    }).slice(2)
  }`;
}

export function createAccountCalldata({
  ksKey,
  ksKeyType,
  nonce,
}: {
  ksKey: Hex;
  ksKeyType: number;
  nonce: bigint;
}) {
  return encodeFunctionData({
    abi: accountFactoryAbi,
    functionName: "createAccount",
    args: [fromHex(ksKey, "bigint"), ksKeyType, nonce],
  });
}

export async function getAccountAddress<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { ksKey, ksKeyType, nonce }: { ksKey: Hex; ksKeyType: number; nonce: bigint },
) {
  return await readContract(client, {
    abi: accountFactoryAbi,
    address: accountFactoryAddress,
    functionName: "getAddress",
    args: [fromHex(ksKey, "bigint"), ksKeyType, nonce],
  });
}

export function buildUserOperationCalldata({ calls }: { calls: Call[] }): Hex {
  // sort ascending order, 0 first
  const _calls = calls.sort((a, b) => a.index - b.index);
  return encodeFunctionData({
    abi: accountAbi,
    functionName: "executeBatch",
    args: [_calls],
  });
}

export type Call = {
  index: number;
  target: Address;
  value: bigint;
  data: Hex;
};

export function getUserOpHash({
  userOperation,
  chainId,
}: {
  userOperation: UserOperation;
  chainId: bigint;
}): Hex {
  const encodedUserOp = encodeAbiParameters(
    [
      { name: "sender", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "initCode", type: "bytes32" },
      { name: "callData", type: "bytes32" },
      { name: "callGasLimit", type: "uint256" },
      {
        name: "verificationGasLimit",
        type: "uint256",
      },
      {
        name: "preVerificationGas",
        type: "uint256",
      },
      { name: "maxFeePerGas", type: "uint256" },
      {
        name: "maxPriorityFeePerGas",
        type: "uint256",
      },
      { name: "paymasterAndData", type: "bytes32" },
    ],
    [
      userOperation.sender,
      userOperation.nonce,
      keccak256(userOperation.initCode),
      keccak256(userOperation.callData),
      userOperation.callGasLimit,
      userOperation.verificationGasLimit,
      userOperation.preVerificationGas,
      userOperation.maxFeePerGas,
      userOperation.maxPriorityFeePerGas,
      keccak256(userOperation.paymasterAndData),
    ],
  );
  const hashedUserOp = keccak256(encodedUserOp);
  const encodedWithChainAndEntryPoint = encodeAbiParameters(
    [
      { name: "userOpHash", type: "bytes32" },
      { name: "entryPoint", type: "address" },
      { name: "chainId", type: "uint256" },
    ],
    [hashedUserOp, entryPointAddress, chainId],
  );
  return keccak256(encodedWithChainAndEntryPoint);
}
