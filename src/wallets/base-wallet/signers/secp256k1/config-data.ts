import { type Hex, encodeAbiParameters, keccak256 } from "viem";
import { CoinbaseSmartWalletConfigData } from "../../config";
import { privateKeyToAccount } from "viem/accounts";


/**
 * Encodes the given private key as the raw bytes of the Base Wallet config data format.
 * 
 * @param privateKey - The private key as a hex string.
 * @returns The config data as a hex string.
 */
export function getConfigDataForPrivateKey(privateKey: Hex): CoinbaseSmartWalletConfigData {
  const ownerBytes = serializePublicKeyFromPrivateKey(privateKey);
  return { owners: [ownerBytes] };
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
