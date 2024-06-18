import { bundlerActions, BundlerClient } from "permissionless";
import { createPublicClient, http, HttpTransportConfig, PublicClient } from "viem";
import { baseSepolia } from "viem/chains";
import { keyspaceActions } from "../../src/keyspace-viem/decorators/keyspace";
import { recoveryServiceActions } from "../../src/keyspace-viem/decorators/recovery-service";

export const chain = baseSepolia;

export const client: PublicClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || ""
  ),
});

export const bundlerClient: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.BUNDLER_RPC_URL || ""
  ),
}).extend(bundlerActions);

const keyspaceClientConfig: HttpTransportConfig = {
  // By default, viem will retry failed requests 3 times. It considers timeouts
  // as failures and will retry them as well.
  retryCount: 0,
  timeout: 120000,
};

export const keyspaceClient = createPublicClient({
  chain,
  transport: http(
    process.env.KEYSPACE_RPC_URL || "https://sepolia-alpha.key.space",
    keyspaceClientConfig
  ),
}).extend(keyspaceActions());

export const recoveryClient = createPublicClient({
  chain,
  transport: http(
    process.env.RECOVERY_RPC_URL || "http://localhost:8555",
    keyspaceClientConfig
  ),
}).extend(recoveryServiceActions());
