import { BundlerClient, estimateUserOperationGas, UserOperation } from "permissionless";
import { Address, Chain, encodeAbiParameters, encodeFunctionData, Hex, keccak256, PublicClient, Transport } from "viem";
import { estimateFeesPerGas, getBytecode, readContract } from "viem/actions";
import { accountAbi, accountFactoryAbi, accountFactoryAddress, entryPointAbi, entryPointAddress } from "../generated";

export const PASSKEY_OWNER_DUMMY_SIGNATURE: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000170000000000000000000000000000000000000000000000000000000000000001949fc7c88032b9fcb5f6efc7a7b8c63668eae9871b765e23123bb473ff57aa831a7c0d9276168ebcc29f2875a0239cffdf2a9cd1c2007c5c77c071db9264df1d000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008a7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2273496a396e6164474850596759334b7156384f7a4a666c726275504b474f716d59576f4d57516869467773222c226f726967696e223a2268747470733a2f2f7369676e2e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d00000000000000000000000000000000000000000000";

export async function buildUserOp(
  client: BundlerClient,
  {
    account,
    signers,
    calls,
    paymasterAndData = "0x",
  }: {
    account: Address;
    signers: Hex[];
    calls: Call[];
    paymasterAndData: Hex;
  },
): Promise<UserOperation> {
  let initCode: Hex = "0x";
  const code = await getBytecode(client, { address: account });
  if (!code) {
    initCode = getInitCode({
      owners: signers,
      index: 0n,
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

  const op = {
    sender: account,
    nonce,
    initCode,
    callData,
    paymasterAndData,
    signature: PASSKEY_OWNER_DUMMY_SIGNATURE,
    preVerificationGas: 1_000_000n,
    verificationGasLimit: 1_000_000n,
    callGasLimit: 1_000_000n,
    ...maxFeesPerGas,
  };

  const gasLimits = await estimateUserOperationGas(client, {
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  return {
    ...op,
    ...gasLimits,
  };
}

export function getInitCode({ owners, index }: { owners: Hex[]; index: bigint }): Hex {
  return `${accountFactoryAddress}${
    createAccountCalldata({
      owners,
      nonce: index,
    }).slice(2)
  }`;
}

export function createAccountCalldata({
  owners,
  nonce,
}: {
  owners: Hex[];
  nonce: bigint;
}) {
  return encodeFunctionData({
    abi: accountFactoryAbi,
    functionName: "createAccount",
    args: [owners, nonce],
  });
}

export async function getAccountAddress<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { owners, nonce }: { owners: Hex[]; nonce: bigint },
) {
  return await readContract(client, {
    abi: accountFactoryAbi,
    address: accountFactoryAddress,
    functionName: "getAddress",
    args: [owners, nonce],
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
