import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { getMasterKeystoreProofs } from "../src/proofs";
import { l1Client } from "./lib/client";
import { createPublicClient, createWalletClient, http, PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { getIsDeployed, getMasterChainId } from "../src/wallets/base-wallet/contract";

async function main() {
  const parser = new ArgumentParser({
    description: "Sync the wallet's keystore config from the configured master chain to the replica chain",
  });

  parser.add_argument("--private-key", {
    help: "The current private key of the syncer",
    ...defaultToEnv("PRIVATE_KEY"),
  });
  parser.add_argument("--account", {
    help: "The account of the keystore wallet to sync",
    required: true,
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
  const keystoreProofs = await getMasterKeystoreProofs(args.address, masterClient, replicaClient, l1Client);

  // Encode the nonce and --config-data into a Config struct, then hash it and
  //   compare it to the proof.

  // Check if we need to deploy the wallet before syncing.
  if (!await getIsDeployed(replicaClient, args.address) && !args.initial_config_data) {
    console.error("Wallet is not deployed, and no initial config data was provided.");
    process.exit(1);
  }

  // Call confirmConfig on the replica chain with the Config struct and the proof.

  const keystoreStorageRootProof = await getKeystoreStorageRootProof(l1Client, masterClient, client);

  console.log(`Syncing keystore storage root to ${client.chain?.name}...`);
  const account = privateKeyToAccount(args.private_key);
  const walletClient = createWalletClient({
    account,
    chain: client.chain,
    transport: http(
      process.env.RPC_URL || ""
    ),
  });

  const { request } = await client.simulateContract({
    address: bridgedKeystoreAddress,
    abi: bridgedKeystoreAbi,
    functionName: "syncKeystoreStorageRoot",
    args: [keystoreStorageRootProof],
  });

  const hash = await walletClient.writeContract(request);

  console.log("Transaction hash:", hash);
  console.log("Done.")
}

if (import.meta.main) {
  main();
}
