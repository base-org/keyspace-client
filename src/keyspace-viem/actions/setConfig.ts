import { Chain, Client, EIP1193RequestFn, Transport } from "viem";
import { MKSRRpcSchema, SetConfigParameters } from "./types";
import { stripLeadingZeros } from "./stripLeadingZeros";


export async function setConfig<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: SetConfigParameters,
): Promise<null> {
  const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
  return await request({
    method: "mksr_set",
    params: [stripLeadingZeros(parameters.key), stripLeadingZeros(parameters.newKey), parameters.currentVk, parameters.currentData, parameters.proof],
  });
}
