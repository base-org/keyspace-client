import { estimateUserOperationGas, getRequiredPrefund, UserOperation } from "permissionless";
import { Address, createPublicClient, custom, EIP1193Provider, encodeAbiParameters, encodeFunctionData, formatEther, fromHex, Hex, keccak256, PublicClient } from "viem";
import * as chains from "viem/chains";
import { estimateFeesPerGas, readContract } from "viem/actions";
import { accountAbi, accountFactoryAbi, accountFactoryAddress, entryPointAbi, entryPointAddress } from "../../../generated";
import { getIsDeployed } from "./contract";
import { createCustomClient, ProviderClientConfig, EthereumProvider } from "../../client";

export type BuildUserOpParameters = {
  account: Address;
  calls: Call[];
  initialConfigData: Hex;
  paymasterAndData: Hex;
  dummySignature: Hex;
}

/**
 * Builds a UserOperation object for a given client and parameters.
 *
 * @param client - The PublicClient instance to interact with the blockchain.
 * @param initialConfigData - The initial configuration data for the wallet.
 * @param calls - An array of Call objects representing the operations to be performed.
 * @param paymasterAndData - The paymaster and data in hexadecimal format (default is "0x").
 * @param signatureType - The type of signature to use ("secp256k1" or "webauthn").
 * @returns A promise that resolves to a UserOperation object.
 * @throws Will throw an error if the sender's balance is less than the required prefund.
 */
export async function buildUserOp(
  client: PublicClient,
  {
    account,
    initialConfigData,
    calls,
    paymasterAndData = "0x",
    dummySignature,
  }: BuildUserOpParameters
): Promise<UserOperation> {
  let initCode: Hex = "0x";
  if (!await getIsDeployed(client, account)) {
    const counterfactualAddress = await getAddress(client, { initialConfigData, nonce: 0n });
    if (account !== counterfactualAddress) {
      throw new Error(`Counterfactual address ${counterfactualAddress} does not match expected address ${account}. Did you provide the correct initial config data?`);
    }

    initCode = getInitCode({
      client,
      initialConfigData,
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

  const op = {
    sender: account,
    nonce,
    initCode,
    callData,
    paymasterAndData,
    signature: dummySignature,
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
 * @param initialConfigData - The initial configuration data for the wallet.
 * @param nonce - The nonce value used to deploy a unique wallet.
 * @returns The generated initialization code.
 */
export function getInitCode({
  client,
  initialConfigData,
  nonce,
}: {
  client: PublicClient;
  initialConfigData: Hex;
  nonce: bigint;
}): Hex {
  if (!client.chain?.id) {
    throw new Error("Chain not found");
  }

  return `${accountFactoryAddress[client.chain.id as keyof typeof accountFactoryAddress]}${
    createAccountCalldata({
      initialConfigData,
      nonce,
    }).slice(2)
  }`;
}

/**
 * Generates the calldata for creating a Base Wallet.
 *
 * @param initialConfigData - The initial configuration data for the wallet.
 * @param nonce - The nonce value used to deploy a unique wallet.
 * @returns The encoded function data for account creation.
 */
export function createAccountCalldata({
  initialConfigData,
  nonce,
}: {
  initialConfigData: Hex;
  nonce: bigint;
}) {
  return encodeFunctionData({
    abi: accountFactoryAbi,
    functionName: "createAccount",
    args: [initialConfigData, nonce],
  });
}

/**
 * Retrieves the address of the Base Wallet with the provided initial configuration.
 *
 * @param client - The public client instance used to interact with the blockchain.
 * @param initialConfigData - The initial configuration data for the wallet.
 * @param nonce - The nonce value used to deploy a unique wallet.
 * @returns The Base Wallet address.
 */
export async function getAddress(
  clientConfig: ProviderClientConfig,
  { initialConfigData, nonce }: { initialConfigData: Hex; nonce: bigint },
) {
  const client = createCustomClient(clientConfig);

  return await readContract(client, {
    abi: accountFactoryAbi,
    address: accountFactoryAddress[client.chain?.id as keyof typeof accountFactoryAddress],
    functionName: "getAddress",
    args: [initialConfigData, nonce],
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
