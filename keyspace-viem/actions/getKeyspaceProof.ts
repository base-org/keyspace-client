import { Account, Chain, Client, EIP1193RequestFn, Hash, RpcSchema, Transport } from "viem";

export type GetProofParameters = {
  key: Hash;
  vkHash: Hash;
  dataHash: Hash;
}

export type GetProofReturnType = {
  root: Hash;
  proof: Hash;
}

type MKSRRpcSchema = RpcSchema & [
  {
    Method: "mksr_proof";
    Parameters: [Hash, Hash, Hash];
    ReturnType: GetProofReturnType;
  }
]

export async function getKeyspaceProof<
  TChain extends Chain | undefined,
>(
  client: Client<Transport, TChain>,
  parameters: GetProofParameters,
): Promise<GetProofReturnType> {
  const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
  return await request({
    method: "mksr_proof",
    params: [parameters.key, parameters.vkHash, parameters.dataHash],
  });
}
