import { Call } from "../utils/smartWallet";
import { getAccount, makeCalls } from "./base";

async function main() {
  const to = await getAccount();
  const amount = 1n;
  const calls: Call[] = [{
    index: 0,
    target: to,
    data: "0x",
    value: amount,
  }];
  makeCalls(calls);
}

main();
