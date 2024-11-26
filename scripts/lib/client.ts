import { bundlerActions, BundlerClient } from "permissionless";
import { createPublicClient, http, PublicClient } from "viem";
import { baseSepolia, sepolia } from "viem/chains";
import { publicActionsL2 } from 'viem/op-stack';

export const chain = baseSepolia;

export const client: PublicClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || ""
  ),
});

export const masterClient: PublicClient = client;

export const l1Client: PublicClient = createPublicClient({
  chain: sepolia,
  transport: http(
    process.env.L1_RPC_URL || ""
  ),
}).extend(publicActionsL2());

export const bundlerClient: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.BUNDLER_RPC_URL || ""
  ),
}).extend(bundlerActions);
