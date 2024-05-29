import { ArgumentParser } from "argparse";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeySecp256k1 } from "./secp256k1/base";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeyWebAuthn } from "./webAuthn/base";
import { defaultToEnv } from "../../utils/argparse";
import { getAccount } from "../../utils/keyspace";


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
  let keyspaceKey;
  if (args.signature_type === "secp256k1") {
    keyspaceKey = await getKeyspaceKeyForPrivateKeySecp256k1(args.private_key);
  } else if (args.signature_type === "webauthn") {
    keyspaceKey = await getKeyspaceKeyForPrivateKeyWebAuthn(args.private_key);
  } else {
    console.error("Invalid circuit type");
  }
  console.log("Keyspace key:", keyspaceKey);
  console.log("Account address:", await getAccount(keyspaceKey as `0x${string}`, 0n, args.signature_type));
}

if (import.meta.main) {
  main();
}
