import { Hex, encodeAbiParameters, fromHex, keccak256, toHex } from "viem";
import { getDataHashForPrivateKey as getDataHashSecp256k1, vkHashEcdsaAccount, keyspaceClient, recoveryClient } from "./secp256k1/base";
import { getKeyspaceKey } from "../../utils/keyspace";
import { vkHashWebAuthnAccount } from "../keyspace/webAuthn/base";
import { ECDSA, encodePackedSignature } from "../../utils/encodeSignatures/secp256k1";
import { encodeWebAuthnAuth } from "../../utils/encodeSignatures/webAuthn";
import { p256WebAuthnSign } from "../../utils/sign";
import { getDataHashForPrivateKey as getDataHashWebAuthn, authenticatorData } from "./webAuthn/base";
import { sign } from "viem/accounts";
import { ArgumentParser } from "argparse";
import { defaultToEnv } from "../../utils/argparse";
const ECDSA = require("ecdsa-secp256r1");


export async function changeOwnerSecp256k1(keyspaceKey: Hex, currentPrivateKey: Hex, newPrivateKey: Hex) {
  const dataHash = getDataHashSecp256k1(newPrivateKey);
  const newKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
  const signature = await sign({ hash: newKey254, privateKey: currentPrivateKey });
  const signatureData = encodePackedSignature(signature);
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
  const webAuthnAuthEncoded = encodeWebAuthnAuth({
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
  const recoverResult = await recoveryClient.getSignatureProof({
    key,
    newKey,
    circuitType,
    signature: signatureData,
  });

  console.log("recovery_signatureProof succeeded", recoverResult);
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

function main() {
  const parser = new ArgumentParser({
    description: "Change owner of a keyspace key",
  });

  parser.add_argument("--keyspace-key", {
    help: "The keyspace key to change owner of",
    ...defaultToEnv("KEYSPACE_KEY"),
  });
  parser.add_argument("--private-key", {
    help: "The current private key of the owner",
    ...defaultToEnv("PRIVATE_KEY"),
  });
  parser.add_argument("--new-private-key", {
    help: "The new private key of the owner",
    ...defaultToEnv("NEW_PRIVATE_KEY"),
  });
  parser.add_argument("--signature-type", {
    help: "The type of signature for the Keyspace key",
    default: "secp256k1",
  });

  const args = parser.parse_args();
  if (args.signature_type === "secp256k1") {
    changeOwnerSecp256k1(args.keyspace_key, args.private_key, args.new_private_key);
  } else if (args.signature_type === "webauthn") {
    const currentPrivateKey = ECDSA.fromJWK(JSON.parse(args.private_key));
    const newPrivateKey = ECDSA.fromJWK(JSON.parse(args.new_private_key));
    changeOwnerWebAuthn(args.keyspace_key, currentPrivateKey, newPrivateKey);
  } else {
    console.error("Invalid circuit type");
  }
}

if (import.meta.main) {
  main();
}
