import { ArgumentParser } from "argparse";

import { defaultToEnv } from "./lib/argparse";
import { changeOwnerSecp256k1, changeOwnerWebAuthn } from "../src/set-value";
import { vkHashEcdsaAccount } from "../src/wallets/base-wallet/signers/secp256k1/calls";
import { authenticatorData } from "../src/wallets/base-wallet/signers/webauthn/sign";
const P256 = require("ecdsa-secp256r1");


function main() {
  const parser = new ArgumentParser({
    description: "Change owner of a keyspace key",
  });

  parser.add_argument("--keystore-id", {
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
      keyspaceKey: args.keystore_id,
      currentPrivateKey: args.private_key,
      newPrivateKey: args.new_private_key,
      vkHash: vkHashEcdsaAccount,
      keyspaceClient,
      recoveryClient,
    });
  } else if (args.signature_type === "webauthn") {
    const currentPrivateKey = P256.fromJWK(JSON.parse(args.private_key));
    const newPrivateKey = P256.fromJWK(JSON.parse(args.new_private_key));
    changeOwnerWebAuthn({
      keyspaceKey: args.keystore_id,
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
