import { encodeFunctionData, parseEther } from "viem";
import { Call } from "../..";
import { magicSpendAbi, magicSpendAddress } from "../../generated";
import { withdrawSignature } from "../../utils/magicSpend";
import { client, getAccount, makeCalls } from "../base";

const asset = "0x0000000000000000000000000000000000000000";
const amount = parseEther("0.001");
const account = await getAccount();
const nonce = BigInt(Math.floor(Math.random() * 10000));
const expiry = Math.floor(Date.now() / 1000) + 1000;
const chainId = client.chain!.id;

async function main() {
  const functionData = encodeFunctionData({
    abi: magicSpendAbi,
    functionName: "withdraw",
    args: [
      {
        signature: await withdrawSignature({ account, asset, amount, nonce, expiry, chainId }),
        asset,
        amount,
        nonce,
        expiry,
      },
    ],
  });
  const calls: Call[] = [{
    index: 0,
    target: magicSpendAddress,
    data: functionData,
    value: 0n,
  }];
  makeCalls(calls);
}

main();
