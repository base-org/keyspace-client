import { Hex, toHex, Address } from "viem";
import { getInitialValueHash } from "../../../../value-hash";
import { getStorageHash } from "../../storage";


/**
 * Generates a storage hash for a given P256 private key.
 *
 * @param privateKey - The signer's private key. 
 * @returns The storage hash as a Hex string.
 */
export function getStorageHashForPrivateKey(privateKey: any): Hex {
  const pk256 = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  return getStorageHash(toHex(pk256));
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
