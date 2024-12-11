import { Address, encodeAbiParameters, encodeFunctionData, encodePacked, fromHex, Hex, keccak256, PublicClient, toHex } from "viem";
import { accountAbi } from "../generated";
import { MASTER_KEYSTORE_STORAGE_LOCATION } from "./proofs/op-stack";
import { createCustomClient } from "./client";
import { ProviderClientConfig } from "./client";

export type KeystoreConfig = {
  account: Address;
  nonce: bigint;
  data: Hex;
}

export type MasterKeystoreStorage = {
  configHash: Hex;
  configNonce: bigint;
};

export function encodeConfig({ account, nonce, data }: KeystoreConfig): Hex {
  return encodePacked(
    ["address", "uint256", "bytes"],
    [account, nonce, data]
  );
}

export function hashConfig({ account, nonce, data }: KeystoreConfig): Hex {
  return keccak256(encodeConfig({ account, nonce, data }));
}

/**
 * Retrieves the current nonce for the given keystore account.
 *
 * @param client - The PublicClient instance connected to the master chain.
 * @param account - The address of the keystore account to get the nonce for.
 * @returns The current nonce for the keystore account.
 */

export async function getMasterKeystoreStorage(provider: ProviderClientConfig, account: Address): Promise<MasterKeystoreStorage> {
  const client = createCustomClient(provider);
  const configHashSlot = toHex(fromHex(MASTER_KEYSTORE_STORAGE_LOCATION, "bigint") + 0n);
  const configNonceSlot = toHex(fromHex(MASTER_KEYSTORE_STORAGE_LOCATION, "bigint") + 1n);

  return {
    configHash: await client.getStorageAt({
      address: account,
      slot: configHashSlot,
    }) ?? "0x",
    configNonce: fromHex(await client.getStorageAt({
      address: account,
      slot: configNonceSlot,
    }) ?? "0x", "bigint"),
  };
}

export function buildSetConfigCalldata(config: KeystoreConfig, authorizationProof: Hex) {
  return encodeFunctionData({
    abi: accountAbi,
    functionName: "setConfig",
    args: [config, authorizationProof],
  });
}

export function buildConfirmConfigCalldata(config: KeystoreConfig, keystoreProof: Hex) {
  return encodeFunctionData({
    abi: accountAbi,
    functionName: "confirmConfig",
    args: [config, keystoreProof],
  });
}

type BuildNextConfigArgs = {
  account: Address;
  currentConfigData: Hex;
  newConfigData: Hex;
};

export async function buildNextConfig(provider: ProviderClientConfig, { account, currentConfigData, newConfigData }: BuildNextConfigArgs): Promise<KeystoreConfig> {
  const { configHash, configNonce } = await getMasterKeystoreStorage(provider, account);
  if (fromHex(configHash, "bigint") !== 0n) {
    const expectedConfigHash = hashConfig({ account, nonce: configNonce, data: currentConfigData });
    if (configHash !== expectedConfigHash) {
      throw new Error(`Config hash mismatch: actual ${configHash} !== expected ${expectedConfigHash}`);
    }
  }

  return {
    account,
    nonce: configNonce + 1n,
    data: newConfigData,
  };
}

