import { defineConfig } from "@wagmi/cli";
import entrypointABI from "./abis/Entrypoint.json";
import smartWalletABI from "./abis/SmartWallet.json";
import smartWalletFactoryABI from "./abis/SmartWalletFactory.json";

export default defineConfig({
  out: "./generated.ts",
  contracts: [
    {
      abi: smartWalletFactoryABI,
      address: "0x0BA5ED01C67936AfbEB2022E93dB179c24116976",
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
