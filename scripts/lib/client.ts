import { bundlerActions, BundlerClient } from "permissionless";
import { Chain, Client, createPublicClient, http, HttpTransportConfig, PublicActions, PublicClient, PublicRpcSchema, Transport } from "viem";
import { baseSepolia, Prettify, sepolia } from "viem/chains";
import { publicActionsL2 } from 'viem/op-stack';
import { DebugActions, debugActions } from "../../src/keyspace-viem/decorators/debug";
import { DebugRpcSchema } from "../../src/keyspace-viem/actions/types";

export const chain = baseSepolia;

export type DebugClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
> = Prettify<
  Client<
    transport,
    chain,
    undefined,
    PublicRpcSchema & DebugRpcSchema,
    PublicActions<transport, chain> & DebugActions
  >
>

export const client: DebugClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || ""
  ),
}).extend(debugActions());

export const masterClient: DebugClient = client;

export const l1Client: DebugClient = createPublicClient({
  chain: sepolia,
  transport: http(
    process.env.L1_RPC_URL || ""
  ),
}).extend(debugActions()).extend(publicActionsL2());

export const bundlerClient: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.BUNDLER_RPC_URL || ""
  ),
}).extend(bundlerActions);
