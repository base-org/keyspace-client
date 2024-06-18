import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { getAccount } from "../src/keyspace";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeySecp256k1 } from "../src/encode-signatures/secp256k1";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeyWebAuthn } from "../src/encode-signatures/webauthn";
import { vkHashWebAuthnAccount } from "./lib/webauthn";
import { vkHashEcdsaAccount } from "./lib/secp256k1";
import { client } from "./lib/client";
const ECDSA = require("ecdsa-secp256r1");


async function main() {
  const parser = new ArgumentParser({
    description: "Get the keyspace key and account address for a given private key",
  });

  parser.add_argument("--private-key", {
    help: "The current private key of the owner",
    ...defaultToEnv("PRIVATE_KEY"),
  });
  parser.add_argument("--signature-type", {
    help: "The type of signature for the Keyspace key",
    default: "secp256k1",
  });

  const args = parser.parse_args();
  let keyspaceKey;
  if (args.signature_type === "secp256k1") {
    keyspaceKey = await getKeyspaceKeyForPrivateKeySecp256k1(args.private_key, vkHashEcdsaAccount);
  } else if (args.signature_type === "webauthn") {
    const privateKey = ECDSA.fromJWK(JSON.parse(args.private_key));
    keyspaceKey = await getKeyspaceKeyForPrivateKeyWebAuthn(privateKey, vkHashWebAuthnAccount);
  } else {
    console.error("Invalid circuit type");
  }
  console.log("Keyspace key:", keyspaceKey);
  console.log("Account address:", await getAccount(client, keyspaceKey as `0x${string}`, 0n, args.signature_type));
}

if (import.meta.main) {
  main();
}
