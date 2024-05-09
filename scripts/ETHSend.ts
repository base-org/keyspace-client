import { Call } from "../utils/smartWallet";
import * as webAuthnBase from "./base";
import * as keyspaceEOABase from "./keyspaceEOABase";
import * as keyspaceWebAuthnBase from "./keyspaceWebAuthnBase";

async function main() {
  let baseModule: any = webAuthnBase;
  if (process.argv.includes("--keyspace-eoa")) {
    console.log("Using EOA via keyspace...");
    baseModule = keyspaceEOABase;
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
