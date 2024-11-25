import { Hex } from "viem";
import { sign } from "viem/accounts";
import { wrapSignature } from "../../user-op";
import { encodePackedSignature } from "./signatures";

export type SignAndWrapParameters = {
  hash: Hex;
  ownerIndex: bigint;
  privateKey: Hex;
};

/**
 * Signs a hash with the provided private key and wraps the signature for use by the Base Wallet contracts.
 *
 * @param hash - The hash to be signed.
 * @param privateKey - The secp256k1 private key used for signing.
 * @param keystoreID - The keystore ID associated with the Base Wallet.
 * @returns A promise that resolves to the wrapped signature as a hex string.
 */
export async function signAndWrap({ hash, ownerIndex, privateKey }: SignAndWrapParameters): Promise<Hex> {
  const signature = await sign({ hash, privateKey });
  return wrapSignature(ownerIndex, encodePackedSignature(signature));
}
