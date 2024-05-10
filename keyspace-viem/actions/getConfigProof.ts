import { Chain, Client, EIP1193RequestFn, Hash, Transport } from "viem";
import { GetConfigProofParameters, GetConfigProofReturnType, MKSRRpcSchema } from "./types";


export async function getConfigProof<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: GetConfigProofParameters,
): Promise<GetConfigProofReturnType> {
  const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
  return await request({
    method: "mksr_proof",
    params: [parameters.key, parameters.vkHash, parameters.dataHash],
  });
}
