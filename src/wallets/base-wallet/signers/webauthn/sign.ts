import { base64urlnopad } from "@scure/base";
import {
  decodeAbiParameters, encodePacked,
  hexToBigInt,
  hexToBytes,
  sha256,
  stringToBytes,
  type Hex
} from "viem";
import { l1Client, masterClient, client } from "../../../../../scripts/lib/client";
import { getConfirmedValueHashStorageProof } from "../../../../proofs";
import { encodeSignature, wrapSignature } from "../../user-op";
import { serializePublicKeyFromPoint } from "./keys";
import { encodeWebAuthnAuth } from "./signatures";

export type P256PrivateKey = {
  x: Buffer;
  y: Buffer;
  sign: (message: string, format: string) => Buffer;
};

export const authenticatorData = "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000";

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

export async function signAndWrap(
  { hash, privateKey, keystoreID }: { hash: Hex; privateKey: P256PrivateKey; keystoreID: Hex; }
): Promise<Hex> {
  const signature = await p256WebAuthnSign({
    challenge: hash,
    authenticatorData,
    p256PrivateKey: privateKey,
  });
  const confirmedValueHashStorageProof = await getConfirmedValueHashStorageProof(
    l1Client, masterClient, client, keystoreID);

  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodeWebAuthnAuth(signature)),
    ownerBytes: serializePublicKeyFromPoint(privateKey.x, privateKey.y),
    confirmedValueHashStorageProof,
  });
}
