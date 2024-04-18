import { encodeFunctionData, erc20Abi } from "viem";
import { swapRouterAbi, swapRouterAddress } from "../generated";
import { Call } from "../utils/smartWallet";
import { getAccount, makeCalls } from "./base";

async function main() {
  const weth = "0x4200000000000000000000000000000000000006";
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const amountIn = BigInt(1e13);
  const amountOutMinimum = 0n;
  const sqrtPriceLimitX96 = 0n;
  const recipient = await getAccount();

  const data = encodeFunctionData({
    abi: swapRouterAbi,
    functionName: "exactInputSingle",
    args: [{
      tokenIn: weth,
      tokenOut: USDC,
      fee: 500,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96,
      recipient,
    }],
  });

  const calls: Call[] = [{ index: 0, target: swapRouterAddress, value: amountIn, data: data }];
  makeCalls(calls);
}

main();
