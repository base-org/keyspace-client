import { Chain, Client, EIP1193RequestFn, Transport } from "viem";
import { GetSignatureProofParameters, GetSignatureProofReturnType, RecoveryServiceRPCSchema } from "./types";
import { stripLeadingZeros } from "./stripLeadingZeros";


export async function getSignatureProof<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: GetSignatureProofParameters,
): Promise<GetSignatureProofReturnType> {
  const request = client.request as EIP1193RequestFn<RecoveryServiceRPCSchema>;
  return await request({
    method: "recover_proveSignature",
    params: [stripLeadingZeros(parameters.key), stripLeadingZeros(parameters.newKey), parameters.signature, parameters.circuitType],
  });
}
