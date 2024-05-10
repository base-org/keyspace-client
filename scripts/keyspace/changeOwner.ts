import { Hex, encodePacked, fromHex, toHex } from "viem";
import { getDataHash as getDataHashSecp256k1, vkHashEcdsaAccount, keyspaceClient } from "./secp256k1/base";
import { getKeyspaceKey } from "../../utils/keyspace";
import { vkHashWebAuthnAccount } from "../keyspaceWebAuthnBase";
import { ECDSA, encodeSignatureDataSecp256k1, encodeSignatureDataWebAuthn, p256WebAuthnSign } from "../../utils/signature";
import { getDataHash as getDataHashWebAuthn, authenticatorData } from "./webauthn/base";
import { sign } from "viem/accounts";


export async function changeOwnerSecp256k1(keyspaceKey: Hex, currentPrivateKey: Hex, newPrivateKey: Hex) {
  const dataHash = getDataHashSecp256k1(newPrivateKey);
  const newKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2));
  const signature = await sign({ hash: newKey254, privateKey: currentPrivateKey });
  const signatureData = encodeSignatureDataSecp256k1(signature);
  performSetConfig(keyspaceKey, newKey, newKey254, "secp256k1", signatureData);
}

export async function changeOwnerWebAuthn(keyspaceKey: Hex, currentPrivateKey: ECDSA, newPrivateKey: ECDSA) {
  const dataHash = getDataHashWebAuthn(newPrivateKey);
  const newKey = getKeyspaceKey(vkHashWebAuthnAccount, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2));
  const { r, s, clientDataJSON } = p256WebAuthnSign({
    challenge: newKey254,
    p256PrivateKey: currentPrivateKey,
    authenticatorData,
  });
  const signatureData = encodeSignatureDataWebAuthn({
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });
  performSetConfig(keyspaceKey, newKey, newKey254, "webauthn", signatureData);
}

async function performSetConfig(key: Hex, newKey: Hex, newKey254: Hex, circuitType: "secp256k1" | "webauthn", signatureData: Hex) {
  const recoverResult = await keyspaceClient.getRecoverProof({
    key,
    newKey254,
    circuitType,
    signature: signatureData,
  });

  await keyspaceClient.setConfig({
    key,
    newKey,
    ...recoverResult,
  });
}
