import { type Hex, encodeAbiParameters, keccak256 } from "viem";
import { hashConfig } from "../../config";

export type CoinbaseSmartWalletConfigData = {
  owners: Hex[];
}

/**
 * Packs the owner bytes into the full Base Wallet keystore config data format.
 *
 * @param ownerBytes - The hexadecimal representation of a single owner's bytes.
 * @returns The encoded keystore record storage.
 */
export function encodeConfigData(configData: CoinbaseSmartWalletConfigData): Hex {
  return encodeAbiParameters([{
    components: [
      { name: "owners", type: "bytes[]" },
    ],
    type: "tuple",
  }], [configData]);
}

/**
 * Computes the config hash for a given configuration.
 *
 * @param data - The config data to be hashed.
 * @returns The hexadecimal representation of the config hash.
 */
export function getConfigHash(nonce: bigint, data: CoinbaseSmartWalletConfigData): Hex {
  return hashConfig(nonce, encodeConfigData(data));
}

export function getConfigWithAddedOwner(config: CoinbaseSmartWalletConfigData, ownerBytes: Hex): CoinbaseSmartWalletConfigData {
  return { 
    ...config,
    owners: [...config.owners, ownerBytes],
  };
}

export function getConfigWithRemovedOwner(config: CoinbaseSmartWalletConfigData, ownerBytes: Hex): CoinbaseSmartWalletConfigData {
  return {
    ...config,
    owners: config.owners.filter((o) => o !== ownerBytes),
  };
}
