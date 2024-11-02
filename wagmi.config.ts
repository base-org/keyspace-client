import { defineConfig } from "@wagmi/cli";
import entrypointABI from "./abis/Entrypoint.json";
import smartWalletABI from "./abis/SmartWallet.json";
import smartWalletFactoryABI from "./abis/SmartWalletFactory.json";

export default defineConfig({
  out: "./generated.ts",
  contracts: [
    {
      abi: smartWalletFactoryABI,
      address: "0xFB739503f4C342E1eef28a42c83f89353873784E",
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
  ],
});
