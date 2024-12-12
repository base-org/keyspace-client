import { Address, encodeFunctionData, PublicClient } from "viem";
import { getCode, readContract } from "viem/actions";
import { accountAbi, accountFactoryAbi, accountFactoryAddress } from "@generated";
import { createCustomClient, ProviderClientConfig } from "@/client";

export async function getIsDeployed(provider: ProviderClientConfig, address: Address): Promise<boolean> {
  const client = createCustomClient(provider);
  const codeAtAddress = await getCode(client, { address });
  return codeAtAddress != undefined && codeAtAddress !== "0x";
}

export async function getMasterChainId(provider: ProviderClientConfig) {
  const client = createCustomClient(provider);
  if (!client.chain?.id) {
    throw new Error("Chain not found");
  }

  const implementation = await readContract(client, {
    address: accountFactoryAddress[client.chain.id as keyof typeof accountFactoryAddress],
    abi: accountFactoryAbi,
    functionName: "implementation",
  });

  const masterChainId = await readContract(client, {
    address: implementation,
    abi: accountAbi,
    functionName: "masterChainId",
  });

  return masterChainId;
}
