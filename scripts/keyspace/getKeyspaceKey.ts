import { ArgumentParser } from "argparse";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeySecp256k1 } from "./secp256k1/base";
import { getKeyspaceKeyForPrivateKey as getKeyspaceKeyForPrivateKeyWebAuthn } from "./webAuthn/base";


async function main() {
  const parser = new ArgumentParser({
    description: "Get the account address for a given private key",
  });

  parser.add_argument("--current-private-key", {
    help: "The current private key of the owner",
    default: process.env.PRIVATE_KEY,
  });
  parser.add_argument("--circuit-type", {
    help: "The type of signature for the Keyspace key",
    default: "secp256k1",
  });

  const args = parser.parse_args();
  let keyspaceKey;
  if (args.circuit_type === "webauthn") {
    keyspaceKey = await getKeyspaceKeyForPrivateKeyWebAuthn(args.current_private_key);
  } else {
    keyspaceKey = await getKeyspaceKeyForPrivateKeySecp256k1(args.current_private_key);
  }
  console.log(keyspaceKey);
}

if (import.meta.main) {
  main();
}
