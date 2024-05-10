import { Chain, Client, EIP1193RequestFn, Hash, Transport } from "viem";
import { GetRecoverProofParameters, GetRecoverProofReturnType, MKSRRpcSchema, SetConfigParameters } from "./types";


export async function setConfig<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: SetConfigParameters,
): Promise<null> {
  const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
  return await request({
    method: "mksr_set",
    params: [parameters.key, parameters.newKey, parameters.currentVk, parameters.currentData, parameters.proof],
  });
}
