import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex } from "viem";
import { sign } from "viem/accounts";
import { l1Client, masterClient, client } from "../../../../../scripts/lib/client";
import { getConfirmedValueHashStorageProof } from "../../../../proofs";
import { encodeSignature, wrapSignature } from "../../user-op";
import { serializePublicKeyFromBytes } from "./keys";
import { encodePackedSignature } from "./signatures";


export async function signAndWrap(
  { hash, privateKey, keystoreID }: { hash: Hex; privateKey: Hex; keystoreID: Hex; }
): Promise<Hex> {
  const signature = await sign({ hash, privateKey });
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  const confirmedValueHashStorageProof = await getConfirmedValueHashStorageProof(
    l1Client, masterClient, client, keystoreID);
  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodePackedSignature(signature)),
    ownerBytes: serializePublicKeyFromBytes(publicKey),
    confirmedValueHashStorageProof,
  });
}
