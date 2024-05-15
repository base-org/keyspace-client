import { Hex, fromHex, keccak256, toHex } from "viem";
import { getDataHash as getDataHashSecp256k1, vkHashEcdsaAccount, keyspaceClient } from "./secp256k1/base";
import { getKeyspaceKey } from "../../utils/keyspace";
import { vkHashWebAuthnAccount } from "../keyspace/webAuthn/base";
import { ECDSA, encodePackedSignatureSecp256k1, encodeSignatureDataWebAuthn, p256WebAuthnSign } from "../../utils/signature";
import { getDataHash as getDataHashWebAuthn, authenticatorData } from "./webAuthn/base";
import { sign } from "viem/accounts";
import { ArgumentParser } from "argparse";


export async function changeOwnerSecp256k1(keyspaceKey: Hex, currentPrivateKey: Hex, newPrivateKey: Hex) {
  const dataHash = getDataHashSecp256k1(newPrivateKey);
  const newKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
  const signature = await sign({ hash: newKey254, privateKey: currentPrivateKey });
  const signatureData = encodePackedSignatureSecp256k1(signature);
  performSetConfig(keyspaceKey, newKey, "secp256k1", signatureData);
}

export async function changeOwnerWebAuthn(keyspaceKey: Hex, currentPrivateKey: ECDSA, newPrivateKey: ECDSA) {
  const dataHash = getDataHashWebAuthn(newPrivateKey);
  const newKey = getKeyspaceKey(vkHashWebAuthnAccount, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
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
  performSetConfig(keyspaceKey, newKey, "webauthn", signatureData);
}

async function performSetConfig(key: Hex, newKey: Hex, circuitType: "secp256k1" | "webauthn", signatureData: Hex) {
  const recoverResult = await keyspaceClient.getRecoverProof({
    key,
    newKey,
    circuitType,
    signature: signatureData,
  });

  console.log("mksr_recover succeeded", recoverResult);
  const fullHash = keccak256(recoverResult.currentVk, "bytes");
  const truncatedHash = fullHash.slice(0, 31);
  const vkHash = toHex(truncatedHash);
  console.log("vkHash", vkHash);

  // FIXME: mksr_set is currently failing.
  // "current key 0x1a5fb74d5bff5a1612f36008c86a989ee61218f078aec555dca4222b5b82bd49, expected 0x1563cace6b39ac44a995db247723ea7f9af0b03189710082fca90187bb4e33e1 (exclusion)"
  await keyspaceClient.setConfig({
    key,
    newKey,
    ...recoverResult,
  });
}

function main() {
  const parser = new ArgumentParser({
    description: "Change owner of a keyspace key",
  });

  parser.add_argument("--keyspace-key", {
    help: "The keyspace key to change owner of",
    default: process.env.KEYSPACE_KEY,
  });
  parser.add_argument("--current-private-key", {
    help: "The current private key of the owner",
    default: process.env.PRIVATE_KEY,
  });
  parser.add_argument("--new-private-key", {
    required: true,
    help: "The new private key of the owner",
  });

  const args = parser.parse_args();
  changeOwnerSecp256k1(args.keyspace_key, args.current_private_key, args.new_private_key);
}

if (import.meta.main) {
  main();
}
