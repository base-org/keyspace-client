import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { getKeystoreStorageRootProof } from "../src/keyspace";
import { client, l1Client, masterClient } from "./lib/client";
import { createWalletClient, http } from "viem";
import { bridgedKeystoreAbi, bridgedKeystoreAddress } from "../generated";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  const parser = new ArgumentParser({
    description: "Sync the keystore root from the configured master chain to the replica chain",
  });

  parser.add_argument("--private-key", {
    help: "The current private key of the syncer",
    ...defaultToEnv("PRIVATE_KEY"),
  });

  const args = parser.parse_args();

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
