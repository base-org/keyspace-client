import { ArgumentParser } from "argparse";

import { defaultToEnv } from "./lib/argparse";
import { ECDSA as Secp256k1ECDSA } from "../src/encode-signatures/secp256k1"; // Renamed import
import { changeOwnerSecp256k1, changeOwnerWebAuthn } from "../src/keyspace";
import { vkHashEcdsaAccount } from "./lib/secp256k1";
import { keyspaceClient, recoveryClient } from "./lib/client";
import { authenticatorData } from "./lib/webauthn";
const Secp256r1ECDSA = require("ecdsa-secp256r1"); // Renamed import

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
    changeOwnerSecp256k1({
      keyspaceKey: args.keyspace_key,
      currentPrivateKey: args.private_key,
      newPrivateKey: args.new_private_key,
      vkHash: vkHashEcdsaAccount,
      keyspaceClient,
      recoveryClient,
    });
  } else if (args.signature_type === "webauthn") {
    const currentPrivateKey = Secp256r1ECDSA.fromJWK(JSON.parse(args.private_key)); // Updated
    const newPrivateKey = Secp256r1ECDSA.fromJWK(JSON.parse(args.new_private_key)); // Updated
    changeOwnerWebAuthn({
      keyspaceKey: args.keyspace_key,
      currentPrivateKey,
      newPrivateKey,
      vkHash: vkHashEcdsaAccount,
      authenticatorData,
      keyspaceClient,
      recoveryClient,
    });
  } else {
    console.error("Invalid circuit type");
  }
}

if (import.meta.main) {
  main();
}
