import { type Hex, decodeAbiParameters, encodeAbiParameters } from "viem";
import { KeystoreConfig } from "@/config";


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

export function decodeConfigData(configData: Hex): CoinbaseSmartWalletConfigData {
  const decoded = decodeAbiParameters([{
    components: [{ name: "owners", type: "bytes[]" }],
    type: "tuple",
  }], configData)[0];
  return {
    owners: [...decoded.owners]
  };
}

export function getConfigDataWithAddedOwner(configData: CoinbaseSmartWalletConfigData, ownerBytes: Hex): CoinbaseSmartWalletConfigData {
  return { 
    ...configData,
    owners: [...configData.owners, ownerBytes],
  };
}

export function getConfigDataWithRemovedOwner(configData: CoinbaseSmartWalletConfigData, ownerBytes: Hex): CoinbaseSmartWalletConfigData {
  return {
    ...configData,
    owners: configData.owners.filter((o) => o !== ownerBytes),
  };
}


