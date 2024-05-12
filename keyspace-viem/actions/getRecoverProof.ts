import { Chain, Client, EIP1193RequestFn, Hash, Transport } from "viem";
import { GetRecoverProofParameters, GetRecoverProofReturnType, MKSRRpcSchema } from "./types";


export async function getRecoverProof<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: GetRecoverProofParameters,
): Promise<GetRecoverProofReturnType> {
  const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
  return await request({
    method: "mksr_recover",
    params: [parameters.key, parameters.newKey, parameters.signature, parameters.circuitType],
  });
}
