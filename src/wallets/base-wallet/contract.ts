import { Address, Client } from "viem";
import { getCode, readContract } from "viem/actions";
import { accountAbi, accountFactoryAbi, accountFactoryAddress } from "../../../generated";


export async function getIsDeployed(client: Client, address: Address): Promise<boolean> {
  const codeAtAddress = await getCode(client, { address });
  return codeAtAddress != undefined && codeAtAddress !== "0x";
}

export async function getMasterChainId(client: Client) {
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
