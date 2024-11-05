import { ArgumentParser } from "argparse";
import { defaultToEnv } from "./lib/argparse";
import { getInitialValueHash } from "../src/value-hash";
import { getStorageHashForPrivateKey as getStorageHashForSecp256k1PrivateKey } from "../src/wallets/base-wallet/signers/secp256k1/storage";
import { getStorageHashForPrivateKey as getStorageHashForWebAuthnPrivateKey } from "../src/wallets/base-wallet/signers/webauthn/storage";
import { client } from "./lib/client";
import { getAddress, controllerAddress } from "../src/wallets/base-wallet/user-op";
import { Hex } from "viem";
const P256 = require("ecdsa-secp256r1");

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
    const privateKey = P256.fromJWK(JSON.parse(args.private_key));
    storageHash = getStorageHashForWebAuthnPrivateKey(privateKey);
  } else {
    console.error("Invalid circuit type");
  }

  const keystoreID = getInitialValueHash(controllerAddress, storageHash as Hex);
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
