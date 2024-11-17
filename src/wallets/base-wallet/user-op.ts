import { estimateUserOperationGas, getRequiredPrefund, UserOperation } from "permissionless";
import { Address, Chain, encodeAbiParameters, encodeFunctionData, formatEther, formatGwei, fromHex, Hex, keccak256, PublicClient, Transport } from "viem";
import { estimateFeesPerGas, getBytecode, readContract } from "viem/actions";
import { accountAbi, accountFactoryAbi, accountFactoryAddress, entryPointAbi, entryPointAddress } from "../../../generated";
import { buildDummySignature as buildDummySecp256k1, encodePackedSignature } from "./signers/secp256k1/signatures";
import { buildDummySignature as buildDummyWebAuthn } from "./signers/webauthn/signatures";
import { SignReturnType } from "viem/accounts";
import { getStorage } from "./storage";

export const PASSKEY_OWNER_DUMMY_SIGNATURE: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000170000000000000000000000000000000000000000000000000000000000000001949fc7c88032b9fcb5f6efc7a7b8c63668eae9871b765e23123bb473ff57aa831a7c0d9276168ebcc29f2875a0239cffdf2a9cd1c2007c5c77c071db9264df1d000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008a7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2273496a396e6164474850596759334b7156384f7a4a666c726275504b474f716d59576f4d57516869467773222c226f726967696e223a2268747470733a2f2f7369676e2e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d00000000000000000000000000000000000000000000";

export const controllerAddress = "0xE534140A4cbBDFEc4CC4ad8fdec707DCea8bB0C5";

/**
 * Builds a UserOperation object for a given client and parameters.
 *
 * @param client - The PublicClient instance to interact with the blockchain.
 * @param controller - The address of the controller.
 * @param storageHash - The storage hash.
 * @param calls - An array of Call objects representing the operations to be performed.
 * @param paymasterAndData - The paymaster and data in hexadecimal format (default is "0x").
 * @param signatureType - The type of signature to use ("secp256k1" or "webauthn").
 * @returns A promise that resolves to a UserOperation object.
 * @throws Will throw an error if the sender's balance is less than the required prefund.
 */
export async function buildUserOp(
  client: PublicClient,
  {
    controller,
    storageHash,
    calls,
    paymasterAndData = "0x",
    signatureType,
  }: {
    controller: Address;
    storageHash: Hex;
    calls: Call[];
    paymasterAndData: Hex;
    signatureType: "secp256k1" | "webauthn";
  },
): Promise<UserOperation> {
  let initCode: Hex = "0x";
  const account = await getAddress(client, { controller, storageHash, nonce: 0n });
  const code = await getBytecode(client, { address: account });
  if (!code) {
    initCode = getInitCode({
      controller,
      storageHash,
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
  // FIXME: Figure out what's wrong with the gas estimation so we don't have to pad the fees.
  maxFeesPerGas.maxFeePerGas += 1000000n
  maxFeesPerGas.maxPriorityFeePerGas += 1000000n

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
    throw new Error(`Sender address ${account} balance (${formatEther(senderBalance)} ETH) is less than required prefund (${formatEther(requiredPrefund)} ETH)`);
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

/**
 * Generates the initcode for a Base Wallet to include with its first user operation.
 *
 * @param controller - The address of the controller.
 * @param storageHash - The storage hash.
 * @param nonce - The nonce value used to deploy a unique wallet.
 * @returns The generated initialization code.
 */
export function getInitCode({
  controller,
  storageHash,
  nonce,
}: {
  controller: Address;
  storageHash: Hex;
  nonce: bigint;
}): Hex {
  return `${accountFactoryAddress}${
    createAccountCalldata({
      controller,
      storageHash,
      nonce,
    }).slice(2)
  }`;
}

/**
 * Generates the calldata for creating a Base Wallet.
 *
 * @param controller - The address of the controller.
 * @param storageHash - The storage hash.
 * @param nonce - The nonce value used to deploy a unique wallet.
 * @returns The encoded function data for account creation.
 */
export function createAccountCalldata({
  controller,
  storageHash,
  nonce,
}: {
  controller: Address;
  storageHash: Hex;
  nonce: bigint;
}) {
  return encodeFunctionData({
    abi: accountFactoryAbi,
    functionName: "createAccount",
    args: [controller, storageHash, nonce],
  });
}

/**
 * Retrieves the address of the Base Wallet with the provided initial configuration.
 *
 * @param client - The public client instance used to interact with the blockchain.
 * @param controller - The address of the controller.
 * @param storageHash - The hash of the storage.
 * @param nonce - The nonce value used to deploy a unique wallet.
 * @returns The Base Wallet address.
 */
export async function getAddress<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { controller, storageHash, nonce }: { controller: Address; storageHash: Hex; nonce: bigint },
) {
  return await readContract(client, {
    abi: accountFactoryAbi,
    address: accountFactoryAddress,
    functionName: "getAddress",
    args: [controller, storageHash, nonce],
  });
}

/**
 * Builds the calldata for one or more calls to be executed via executeBatch.
 *
 * @param calls - An array of calls to be made by the user operation.
 * @returns The encoded calldata for the user operation.
 */
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

/**
 * Computes the hash of a user operation.
 *
 * @param userOperation - The user operation object containing various fields.
 * @param chainId - The chain ID that the user operation will be executed on.
 * @returns The computed hash of the user operation.
 */
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

/**
 * Wraps a signature with index of the owner that signed it.
 *
 * @param ownerIndex - The index of the owner.
 * @param signature - The signature to wrap.
 * @returns The wrapped signature.
 */
export function wrapSignature(ownerIndex: bigint, signature: Hex): Hex {
  return encodeAbiParameters(
    [{
      components: [
        { name: "ownerIndex", type: "uint256" },
        { name: "signatureData", type: "bytes" },
      ],
      type: "tuple",
    }], [{
      ownerIndex,
      signatureData: signature,
    }]
  );
}


/**
 * Encodes the data expected within the signature field of a Base Wallet user operation.
 *
 * @param signatureWrapper
 * @param ownerBytes - The owner's bytes in hexadecimal format.
 * @param confirmedValueHashStorageProof - An MPT proof of the value hash at the latest confirmed
 *        keystore storage root.
 * @returns The encoded user operation signature as a hexadecimal string.
 */
export function encodeSignature({
  signatureWrapper, ownerBytes, confirmedValueHashStorageProof,
}: {
  signatureWrapper: Hex;
  ownerBytes: Hex;
  confirmedValueHashStorageProof: Hex[];
}): Hex {
  const recordData = getStorage(ownerBytes);
  const userOpSig = encodeAbiParameters([{
    components: [
      { name: "sig", type: "bytes" },
      { name: "recordData", type: "bytes" },
      { name: "confirmedValueHashStorageProof", type: "bytes[]" },
      { name: "useAggregator", type: "bool" },
    ],
    type: "tuple",
  }], [{
    sig: signatureWrapper,
    recordData,
    confirmedValueHashStorageProof,
    useAggregator: false,
  }]);

  return userOpSig;
}

