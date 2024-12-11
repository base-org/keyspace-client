import { PublicClient, createPublicClient, custom, fromHex } from "viem";
import * as chains from "viem/chains";

export type EthereumProvider = { request(...args: any): Promise<any>; };

export type ProviderClientConfig = EthereumProvider & {
  chain: {
    id: number;
  } | undefined;
}

export function createCustomClient(provider: ProviderClientConfig): PublicClient {
  const chain = Object.values(chains).find((chain) => chain.id === provider.chain?.id);
  if (!chain) {
    throw new Error("Chain not found");
  }

  return createPublicClient({
    chain,
    transport: custom(provider)
  }) as PublicClient;
}

export async function createProviderClientConfig(provider: EthereumProvider): Promise<ProviderClientConfig> {
  const chainIdResponse = await provider.request({ method: "eth_chainId" });
  const chainId = fromHex(chainIdResponse, "number");

  return {
    chain: {
      id: chainId,
    },
    ...provider,
  };
}
