import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { Call } from "../src/wallets/base-wallet/user-op";
import * as callsSecp256k1 from "../src/wallets/base-wallet/signers/secp256k1/calls";
import * as callsWebAuthn from "../src/wallets/base-wallet/signers/webauthn/calls";
const P256 = require("ecdsa-secp256r1");

async function main() {
  const parser = new ArgumentParser({
    description: "Send 1 wei",
  });

  parser.add_argument("--account", {
    help: "The account of the keystore wallet to send from",
    required: true,
  });
  parser.add_argument("--owner-index", {
    help: "The index of the owner",
    default: 0,
  });
  parser.add_argument("--initial-config-data", {
    help: "The initial config data needed to deploy the wallet as a hex string",
  });
  parser.add_argument("--private-key", {
    help: "The current private key of the owner",
    ...defaultToEnv("PRIVATE_KEY"),
  });
  parser.add_argument("--to", {
    help: "The address to send to",
    required: true,
  });
  parser.add_argument("--signature-type", {
    help: "The type of signature for the signing key",
    default: "secp256k1",
  });

  const args = parser.parse_args();
  let callsModule: any;
  let privateKey: any;
  if (args.signature_type === "secp256k1") {
    console.log("Using secp256k1 via keyspace...");
    callsModule = callsSecp256k1;
    privateKey = args.private_key;
  } else if (args.signature_type === "webauthn") {
    console.log("Using WebAuthn via keyspace...");
    callsModule = callsWebAuthn;
    privateKey = P256.fromJWK(JSON.parse(args.private_key));
  } else {
    console.error("Invalid signature type");
  }

  const amount = 1n;
  const calls: Call[] = [{
    index: 0,
    target: args.to,
    data: "0x",
    value: amount,
  }];
  callsModule.makeCalls({
    account: args.account,
    ownerIndex: args.owner_index,
    initialConfigData: args.initial_config_data,
    privateKey,
    calls,
  });
}

if (import.meta.main) {
  main();
}
