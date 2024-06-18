import { ArgumentParser } from "argparse";
import { defaultToEnv } from "../utils/argparse";
import { getAccount } from "../utils/keyspace";
import { Call } from "../utils/smartWallet";
import * as keyspaceSecp256k1Base from "./lib/secp256k1";
import * as keyspaceWebAuthnBase from "./lib/webAuthn";
import { client } from "./lib/client";
const ECDSA = require("ecdsa-secp256r1");

async function main() {
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
  parser.add_argument("--signature-type", {
    help: "The type of signature for the Keyspace key",
    default: "secp256k1",
  });

  const args = parser.parse_args();
  let baseModule: any;
  let privateKey: any;
  if (args.signature_type === "secp256k1") {
    console.log("Using secp256k1 via keyspace...");
    baseModule = keyspaceSecp256k1Base;
    privateKey = args.private_key;
  } else if (args.signature_type === "webauthn") {
    console.log("Using WebAuthn via keyspace...");
    baseModule = keyspaceWebAuthnBase;
    privateKey = ECDSA.fromJWK(JSON.parse(args.private_key));
  } else {
    console.error("Invalid circuit type");
  }

  const to = await getAccount(client, args.keyspace_key, 0n, args.signature_type);
  const amount = 1n;
  const calls: Call[] = [{
    index: 0,
    target: to,
    data: "0x",
    value: amount,
  }];
  baseModule.makeCalls(args.keyspace_key, privateKey, calls);
}

if (import.meta.main) {
  main();
}
