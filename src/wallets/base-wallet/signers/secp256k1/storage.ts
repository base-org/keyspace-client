import { type Hex, Address, encodeAbiParameters, keccak256 } from "viem";
import { getInitialValueHash } from "../../../../value-hash";
import { getStorageHash } from "../../storage";
import { privateKeyToAccount } from "viem/accounts";


/**
 * Generates a keystore storage hash for a given private key.
 * 
 * The corresponding public key is serialized and hashed to generate the storage hash.
 *
 * @param privateKey - The private key in hexadecimal format.
 * @returns The storage hash in hexadecimal format.
 */
export function getStorageHashForPrivateKey(privateKey: Hex): Hex {
  const ownerBytes = serializePublicKeyFromPrivateKey(privateKey);
  return getStorageHash(ownerBytes);
}

/**
 * Serializes a raw secp256k1 public key into an Ethereum address.
 *
 * @param publicKey - The public key as a Uint8Array.
 * @returns The address padded to 32 bytes.
 */
export function serializePublicKeyFromBytes(publicKey: Uint8Array): Hex {
  const keyHash = keccak256(publicKey);
  const address = `0x${keyHash.slice(2, 42)}` as Hex;
  return encodeAbiParameters([{ type: "address" }], [address]);
}

/**
 * Serializes a secp256k1 private key into an Ethereum address.
 *
 * @param privateKey - The private key.
 * @returns The address padded to 32 bytes.
 */
export function serializePublicKeyFromPrivateKey(privateKey: Hex): Hex {
  const account = privateKeyToAccount(privateKey);
  return encodeAbiParameters([{ type: "address" }], [account.address]);
}

