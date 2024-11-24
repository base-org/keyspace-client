import { Hex, toHex } from "viem";
import { CoinbaseSmartWalletConfigData, encodeConfigData } from "../../config";


/**
 * Encodes the given P256 private key as the raw bytes of the Base Wallet config data format.
 *
 * @param privateKey - The P256 private key as a hex string.
 * @returns The config data as a hex string.
 */
export function getConfigDataForPrivateKey(privateKey: any): CoinbaseSmartWalletConfigData {
  const pk256 = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  return { owners: [toHex(pk256)] };
}

/**
 * Serializes a P256 public key into the 64-byte array that Base Wallet expects.
 *
 * @param x - The x coordinate of the public key as a Uint8Array.
 * @param y - The y coordinate of the public key as a Uint8Array.
 * @returns The serialized public key as a Hex string.
 */
export function serializePublicKeyFromPoint(x: Uint8Array, y: Uint8Array): Hex {
  const keyspaceData = new Uint8Array(64);
  keyspaceData.set(x, 0);
  keyspaceData.set(y, 32);
  return toHex(keyspaceData);
}
