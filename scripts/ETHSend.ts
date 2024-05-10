import { Call } from "../utils/smartWallet";
import * as webAuthnBase from "./base";
import * as keyspaceSecp256k1Base from "./keyspace/secp256k1/base";
import * as keyspaceWebAuthnBase from "./keyspace/webauthn/base";

async function main() {
  let baseModule: any = webAuthnBase;
  if (process.argv.includes("--keyspace-secp256k1")) {
    console.log("Using secp256k1 via keyspace...");
    baseModule = keyspaceSecp256k1Base;
  } else if (process.argv.includes("--keyspace-webauthn")) {
    console.log("Using WebAuthn via keyspace...");
    baseModule = keyspaceWebAuthnBase;
  }
  const to = await baseModule.getAccount();
  const amount = 1n;
  const calls: Call[] = [{
    index: 0,
    target: to,
    data: "0x",
    value: amount,
  }];
  baseModule.makeCalls(calls);
}

main();
