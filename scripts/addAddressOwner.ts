import { encodeFunctionData } from "viem";
import { accountAbi } from "../generated";
import { Call } from "../utils/smartWallet";
import { getAccount, makeCalls } from "./base";

async function main() {
  const to = await getAccount();
  const newOwner = "0x3d85E068D02E4C27da27F3F9532A94D56E8865db";
  const calls: Call[] = [{
    index: 0,
    target: to,
    data: encodeFunctionData({
      abi: accountAbi,
      functionName: "addOwnerAddress",
      args: [newOwner],
    }),
    value: 0n,
  }];
  makeCalls(calls);
}

main();
