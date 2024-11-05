import { type Hex, keccak256, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";


/**
 * Pack a public key into the 32 byte ownerBytes data record expected by
 * CoinbaseSmartWallet.
 */

export function serializePublicKeyFromBytes(publicKey: Uint8Array): Hex {
  const keyHash = keccak256(publicKey);
  const address = `0x${keyHash.slice(2, 42)}` as Hex;
  return encodeAbiParameters([{ type: "address" }], [address]);
}

export function serializePublicKeyFromPrivateKey(privateKey: Hex): Hex {
  const account = privateKeyToAccount(privateKey);
  return encodeAbiParameters([{ type: "address" }], [account.address]);
}
