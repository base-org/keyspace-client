import { base64urlnopad } from "@scure/base";
import {
  Address,
  decodeAbiParameters, encodePacked,
  hexToBigInt,
  hexToBytes,
  sha256,
  stringToBytes,
  type Hex
} from "viem";
import { l1Client, masterClient, client } from "../../../../../scripts/lib/client";
import { encodeSignature, wrapSignature } from "../../user-op";
import { serializePublicKeyFromPoint } from "./config-data";
import { encodeWebAuthnAuth } from "./signatures";

export type P256PrivateKey = {
  x: Buffer;
  y: Buffer;
  sign: (message: string, format: string) => Buffer;
};

export const authenticatorData = "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000";

/**
 * Creates a WebAuthn-formatted payload and signs it with the provided P256 private key.
 * 
 * This is intended to simulate a WebAuthn signature from a browser, not for use by wallets.
 *
 * @param challenge - The challenge in hexadecimal format.
 * @param authenticatorData - The authenticator data in hexadecimal format.
 * @param p256PrivateKey - The P-256 private key used for signing.
 * @returns A WebAuthn-formatted signature.
 */
export function p256WebAuthnSign(
  { challenge, authenticatorData, p256PrivateKey }: { challenge: Hex; authenticatorData: Hex; p256PrivateKey: any; }
) {
  const challengeBase64 = base64urlnopad.encode(hexToBytes(challenge));
  const clientDataJSON = `{"type":"webauthn.get","challenge":"${challengeBase64}","origin":"https://keys.coinbase.com"}`;
  const clientDataJSONHash = sha256(stringToBytes(clientDataJSON));
  const message = encodePacked(["bytes", "bytes32"], [authenticatorData, clientDataJSONHash]);
  const sig = p256PrivateKey.sign(Buffer.from(message.slice(2), "hex"), "hex");
  let [r, s] = decodeAbiParameters([{ type: "uint256" }, { type: "uint256" }], `0x${sig}` as Hex);
  // Restrict signature malleability to pass the check in webauthn-sol.
  const n = hexToBigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");
  if (s > n / 2n) {
    s = n - s;
  }
  return { r, s, clientDataJSON, authenticatorData };
}

/**
 * Signs a hash with the provided private key and wraps the signature for use by the Base Wallet contracts.
 *
 * @param hash - The hash to be signed.
 * @param privateKey - The P256 private key used for signing.
 * @param keystoreID - The keystore ID associated with the Base Wallet.
 * @returns A promise that resolves to the wrapped signature as a hex string.
 */
export async function signAndWrap(
  { hash, privateKey, keystoreAddress }: { hash: Hex; privateKey: P256PrivateKey; keystoreAddress: Address; }
): Promise<Hex> {
  const signature = await p256WebAuthnSign({
    challenge: hash,
    authenticatorData,
    p256PrivateKey: privateKey,
  });
  // TODO: Update getConfirmedValueHashStorageProof to prove the correct slot in keystoreAddress's storage.
  const confirmedValueHashStorageProof = await getConfirmedValueHashStorageProof(
    l1Client, masterClient, client, keystoreAddress as Hex);

  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodeWebAuthnAuth(signature)),
    ownerBytes: serializePublicKeyFromPoint(privateKey.x, privateKey.y),
    confirmedValueHashStorageProof,
  });
}
