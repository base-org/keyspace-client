import { ArgumentParser } from "argparse";

import { defaultToEnv } from "./lib/argparse";
import { CoinbaseSmartWalletConfigData, decodeConfigData, encodeConfigData, getConfigDataWithAddedOwner, getConfigDataWithRemovedOwner } from "../src/wallets/base-wallet/config";
import * as callsSecp256k1 from "../src/wallets/base-wallet/signers/secp256k1/calls";
import * as callsWebAuthn from "../src/wallets/base-wallet/signers/webauthn/calls";
import { buildNextConfig, buildSetConfigCalldata } from "../src/config";
import { masterClient } from "./lib/client";
import { Call } from "../src/wallets/base-wallet/user-op";
const P256 = require("ecdsa-secp256r1");


async function main() {
  const parser = new ArgumentParser({
    description: "Change owner of a keystore wallet",
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
  parser.add_argument("--config-data", {
    help: "The current config data for the keystore wallet as a hex string",
    required: true,
  });
  parser.add_argument("--owner-bytes", {
    help: "The owner bytes to change in the keystore wallet",
    required: true,
  });
  parser.add_argument("--signature-type", {
    help: "The type of signature for the private key",
    default: "secp256k1",
  });
  parser.add_argument("--remove", {
    help: "Remove the owner from the keystore wallet",
    action: "store_true",
  });

  const args = parser.parse_args();

  let privateKey: any;
  let callsModule: any;
  if (args.signature_type === "secp256k1") {
    console.log("Using secp256k1 private key...");
    privateKey = args.private_key;
    callsModule = callsSecp256k1;
  } else if (args.signature_type === "webauthn") {
    console.log("Using WebAuthn private key...");
    privateKey = P256.fromJWK(JSON.parse(args.private_key));
    callsModule = callsWebAuthn;
  } else {
    console.error("Invalid signature type");
  }

  const currentConfigData = decodeConfigData(args.config_data);
  let newConfigData: CoinbaseSmartWalletConfigData;
  if (args.remove) {
    console.log("Removing owner from keystore wallet...");
    newConfigData = getConfigDataWithRemovedOwner(currentConfigData, args.owner_bytes);
  } else {
    console.log("Adding owner to keystore wallet...");
    newConfigData = getConfigDataWithAddedOwner(currentConfigData, args.owner_bytes);
  }

  const encodedNewConfigData = encodeConfigData(newConfigData);
  console.log("New config data:", encodedNewConfigData);

  const newConfig = await buildNextConfig(masterClient, {
    account: args.account,
    currentConfigData: args.config_data,
    newConfigData: encodedNewConfigData,
  });

  console.log(`Setting new config with nonce ${newConfig.nonce}...`);
  const authorizationProof = await callsModule.signSetConfigAuth({
    account: args.account,
    config: newConfig,
    ownerIndex: 0n,
    privateKey,
  });
  const data = buildSetConfigCalldata(newConfig, authorizationProof);

  const calls: Call[] = [{
    index: 0,
    target: args.account,
    data,
    value: 0n,
  }];

  await callsModule.makeCalls({
    account: args.account,
    ownerIndex: args.owner_index,
    initialConfigData: args.initial_config_data,
    privateKey,
    calls,
  });

  console.log("Successfully changed configuration.");
}

if (import.meta.main) {
  main();
}
