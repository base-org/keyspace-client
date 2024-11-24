import { secp256k1 } from "@noble/curves/secp256k1";
import { Address, Hex } from "viem";
import { sign } from "viem/accounts";
import { l1Client, masterClient, client } from "../../../../../scripts/lib/client";
import { encodeSignature, wrapSignature } from "../../user-op";
import { serializePublicKeyFromBytes } from "./config-data";
import { encodePackedSignature } from "./signatures";


/**
 * Signs a hash with the provided private key and wraps the signature for use by the Base Wallet contracts.
 *
 * @param hash - The hash to be signed.
 * @param privateKey - The secp256k1 private key used for signing.
 * @param keystoreID - The keystore ID associated with the Base Wallet.
 * @returns A promise that resolves to the wrapped signature as a hex string.
 */
export async function signAndWrap(
  { hash, privateKey, keystoreAddress }: { hash: Hex; privateKey: Hex; keystoreAddress: Address; }
): Promise<Hex> {
  const signature = await sign({ hash, privateKey });
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  // TODO: Update getConfirmedValueHashStorageProof to prove the correct slot in keystoreAddress's storage.
  const confirmedValueHashStorageProof = await getConfirmedValueHashStorageProof(
    l1Client, masterClient, client, keystoreAddress as Hex);
  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodePackedSignature(signature)),
    ownerBytes: serializePublicKeyFromBytes(publicKey),
    confirmedValueHashStorageProof,
  });
}
