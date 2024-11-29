import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { encodeOPStackProof, getMasterKeystoreProofs } from "../src/proofs/op-stack";
import { l1Client } from "./lib/client";
import { createPublicClient, fromHex, http, PublicClient } from "viem";
import * as chains from "viem/chains";
import { getIsDeployed, getMasterChainId } from "../src/wallets/base-wallet/contract";
import * as callsSecp256k1 from "../src/wallets/base-wallet/signers/secp256k1/calls";
import * as callsWebAuthn from "../src/wallets/base-wallet/signers/webauthn/calls";
import { buildConfirmConfigCalldata, hashConfig } from "../src/config";
import { Call } from "../src/wallets/base-wallet/user-op";
const P256 = require("ecdsa-secp256r1");

async function main() {
  const parser = new ArgumentParser({
    description: "Sync the wallet's keystore config from the configured master chain to the replica chain",
  });

  parser.add_argument("--account", {
    help: "The account of the keystore wallet to sync",
    required: true,
  });
  parser.add_argument("--private-key", {
    help: "The current private key of the syncer",
    ...defaultToEnv("PRIVATE_KEY"),
  });
  parser.add_argument("--signature-type", {
    help: "The type of signature for the private key",
    default: "secp256k1",
  });
  parser.add_argument("--config-data", {
    help: "The current config data for the wallet to sync as a hex string",
    required: true,
  });
  parser.add_argument("--initial-config-data", {
    help: "The initial config data needed to deploy the wallet as a hex string. Required if the wallet has not been deployed.",
  });
  parser.add_argument("--target-chain", {
    help: "The target chain to sync the wallet to",
    default: "OP Sepolia",
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

  // Using the data on the specified replica chain, detect the master chain ID.
  const replicaChain = Object.values(chains).find((chain) => chain.name === args.target_chain);
  const replicaClient: PublicClient = createPublicClient({
    chain: replicaChain,
    transport: http(),
  });

  const masterChainId = await getMasterChainId(replicaClient);
  const masterChain = Object.values(chains).find((chain) => BigInt(chain.id) === masterChainId);
  const masterClient: PublicClient = createPublicClient({
    chain: masterChain,
    transport: http(),
  });

  // Query the master chain and L1 for proofs of the config hash.
  const keystoreProofs = await getMasterKeystoreProofs(args.account, masterClient, replicaClient, l1Client);

  // Encode the nonce and --config-data into a Config struct, then hash it and
  //   compare it to the proof.
  const currentConfig = {
    account: args.account,
    nonce: keystoreProofs.keystoreConfigNonce,
    data: args.config_data,
  };
  const currentConfigHash = hashConfig(currentConfig);
  if (currentConfigHash !== keystoreProofs.keystoreConfigHash) {
    if (fromHex(keystoreProofs.keystoreConfigHash, "bigint") === 0n) {
      console.log("The config hash is empty on the master chain. Syncing the confirmed config timestamp...");
    } else {
      console.warn(`The provided config data does not hash to the expected value. Expected ${keystoreProofs.keystoreConfigHash}, got ${currentConfigHash}.`);
    }
  }

  // Check if we need to deploy the wallet before syncing.
  if (!await getIsDeployed(replicaClient, args.account) && !args.initial_config_data) {
    console.error("Wallet is not deployed, and no initial config data was provided.");
    process.exit(1);
  }

  // Call confirmConfig on the replica chain with the Config struct and the proof.
  const keystoreProof = encodeOPStackProof(keystoreProofs);
  const data = buildConfirmConfigCalldata(currentConfig, keystoreProof);

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

}

if (import.meta.main) {
  main();
}
