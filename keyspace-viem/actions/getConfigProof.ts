import { Chain, Client, EIP1193RequestFn, Transport } from "viem";
import { GetConfigProofParameters, GetConfigProofReturnType, MKSRRpcSchema } from "./types";
import { stripLeadingZeros } from "./stripLeadingZeros";


export async function getConfigProof<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: GetConfigProofParameters,
): Promise<GetConfigProofReturnType> {
  const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
  return await request({
    method: "mksr_proof",
    params: [stripLeadingZeros(parameters.key), stripLeadingZeros(parameters.vkHash), stripLeadingZeros(parameters.dataHash)],
  });
}
