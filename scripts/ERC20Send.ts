import { encodeFunctionData, erc20Abi } from "viem";
import { Call } from "../utils/smartWallet";
import { getAccount, makeCalls } from "./base";

async function main() {
  // USDC on Base
  const erc20 = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const to = await getAccount();
  const amount = 1n;
  const calls: Call[] = [{
    index: 0,
    target: erc20,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, amount],
    }),
    value: 0n,
  }];
  makeCalls(calls);
}

main();
