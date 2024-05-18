import { Hex, encodeAbiParameters, fromHex, keccak256, toHex } from "viem";
import { getDataHash as getDataHashSecp256k1, vkHashEcdsaAccount, keyspaceClient } from "./secp256k1/base";
import { getKeyspaceKey } from "../../utils/keyspace";
import { vkHashWebAuthnAccount } from "../keyspace/webAuthn/base";
import { ECDSA, encodePackedSignatureSecp256k1, encodeSignatureDataWebAuthn, p256WebAuthnSign } from "../../utils/signature";
import { getDataHash as getDataHashWebAuthn, authenticatorData } from "./webAuthn/base";
import { sign } from "viem/accounts";
import { ArgumentParser } from "argparse";
const ECDSA = require("ecdsa-secp256r1");


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

  // Changing owners requires the current public key, which cannot be recovered
  // from the signature without its v value. Instead, the signature data is
  // packed as (bytes32,bytes32,bytes) to include the public key for
  // this operation. The final bytes argument contains an ABI-encoded
  // WebAuthnAuth.
  const webAuthnAuthEncoded = encodeSignatureDataWebAuthn({
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });
  const signatureData = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes" }],
    [toHex(currentPrivateKey.x), toHex(currentPrivateKey.y), webAuthnAuthEncoded],
  );
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

  await keyspaceClient.setConfig({
    key,
    newKey,
    ...recoverResult,
  });
}

function defaultToEnv(varName: string) {
  const value = process.env[varName];
  if (!value) {
    return { required: true };
  }
  return { default: value };
}

function main() {
  const parser = new ArgumentParser({
    description: "Change owner of a keyspace key",
  });

  parser.add_argument("--keyspace-key", {
    help: "The keyspace key to change owner of",
    ...defaultToEnv("KEYSPACE_KEY"),
  });
  parser.add_argument("--current-private-key", {
    help: "The current private key of the owner",
    ...defaultToEnv("PRIVATE_KEY"),
  });
  parser.add_argument("--new-private-key", {
    help: "The new private key of the owner",
    ...defaultToEnv("NEW_PRIVATE_KEY"),
  });
  parser.add_argument("--circuit-type", {
    help: "The type of signature for the Keyspace key",
    default: "secp256k1",
  });

  const args = parser.parse_args();
  if (args.circuit_type === "secp256k1") {
    changeOwnerSecp256k1(args.keyspace_key, args.current_private_key, args.new_private_key);
  } else if (args.circuit_type === "webauthn") {
    const currentPrivateKey = ECDSA.fromJWK(JSON.parse(args.current_private_key));
    const newPrivateKey = ECDSA.fromJWK(JSON.parse(args.new_private_key));
    changeOwnerWebAuthn(args.keyspace_key, currentPrivateKey, newPrivateKey);
  } else {
    console.error("Invalid circuit type");
  }
}

if (import.meta.main) {
  main();
}
