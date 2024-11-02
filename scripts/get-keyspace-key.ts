import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { getKeystoreID } from "../src/keyspace";
import { getStorageHashForPrivateKey as getStorageHashForSecp256k1PrivateKey } from "../src/encode-signatures/secp256k1";
import { getStorageHashForPrivateKey as getStorageHashForWebAuthnPrivateKey } from "../src/encode-signatures/webauthn";
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
  let storageHash;
  if (args.signature_type === "secp256k1") {
    storageHash = getStorageHashForSecp256k1PrivateKey(args.private_key);
  } else if (args.signature_type === "webauthn") {
    const privateKey = ECDSA.fromJWK(JSON.parse(args.private_key));
    storageHash = getStorageHashForWebAuthnPrivateKey(privateKey);
  } else {
    console.error("Invalid circuit type");
  }

  const keystoreID = getKeystoreID(controllerAddress, storageHash as Hex);
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
