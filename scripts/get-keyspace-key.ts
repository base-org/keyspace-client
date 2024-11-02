import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { getKeystoreID } from "../src/keyspace";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeySecp256k1 } from "../src/encode-signatures/secp256k1";
import { getStorageHashForPrivateKey } from "../src/encode-signatures/webauthn";
import { vkHashEcdsaAccount } from "./lib/secp256k1";
import { client } from "./lib/client";
import { getAddress } from "../src/smart-wallet";
import { Hex } from "viem";
const ECDSA = require("ecdsa-secp256r1");

const controllerAddress = "0xE534140A4cbBDFEc4CC4ad8fdec707DCea8bB0C5";

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
  let keystoreID, storageHash;
  if (args.signature_type === "secp256k1") {
    keystoreID = getKeyspaceKeyForPrivateKeySecp256k1(args.private_key, vkHashEcdsaAccount);
  } else if (args.signature_type === "webauthn") {
    const privateKey = ECDSA.fromJWK(JSON.parse(args.private_key));
    storageHash = getStorageHashForPrivateKey(privateKey);
    keystoreID = getKeystoreID(controllerAddress, storageHash, 0n);
  } else {
    console.error("Invalid circuit type");
  }
  console.log("Keystore ID:", keystoreID);
  console.log("Account address:", await getAddress(client, {
    controller: controllerAddress,
    storageHash: storageHash as Hex,
    nonce: 0n,
  }));
}

if (import.meta.main) {
  main();
}
