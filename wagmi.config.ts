import { defineConfig } from "@wagmi/cli";
import entrypointABI from "./abis/Entrypoint.json";
import erc1271InputGeneratorABI from "./abis/ERC1271InputGenerator.json";
import magicSpendABI from "./abis/MagicSpend.json";
import smartWalletABI from "./abis/SmartWallet.json";
import smartWalletFactoryABI from "./abis/SmartWalletFactory.json";
import swapRouterABI from "./abis/SwapRouter.json";

export default defineConfig({
  out: "./generated.ts",
  contracts: [
    {
      abi: smartWalletFactoryABI,
      address: "0xFd053fbB6a6dC666C67b59dBAcf59307De2Df6ae",
      name: "AccountFactory",
    },
    {
      abi: smartWalletABI,
      name: "Account",
    },
    {
      abi: entrypointABI,
      name: "EntryPoint",
      address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    },
    {
      abi: swapRouterABI,
      name: "SwapRouter",
      address: "0x2626664c2603336e57b271c5c0b26f421741e481",
    },
    {
      abi: magicSpendABI,
      name: "MagicSpend",
      address: "0xC521470f6bA58cac0bc752FC25C46fc811605F2C",
    },
    {
      abi: erc1271InputGeneratorABI,
      name: "erc1271InputGenerator",
    },
  ],
});
