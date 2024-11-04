import { Chain, Client, EIP1193RequestFn, Hex, Transport } from "viem";
import { DebugRpcSchema, GetRawHeaderParameters } from "./types";


export async function getRawHeader<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: GetRawHeaderParameters,
): Promise<Hex> {
  const request = client.request as EIP1193RequestFn<DebugRpcSchema>;
  return await request({
    method: "debug_getRawHeader",
    params: [parameters.blockNumberOrTag],
  });
}
