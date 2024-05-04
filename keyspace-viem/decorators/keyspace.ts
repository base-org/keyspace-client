import { Account, Chain, Client, Transport } from "viem";
import { GetProofParameters, GetProofReturnType, getKeyspaceProof } from "../actions/getKeyspaceProof";

export type KeyspaceActions = {
  getKeyspaceProof: (parameters: GetProofParameters) => Promise<GetProofReturnType>;
}

export function keyspaceActions() {
  return <
    transport extends Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends Account | undefined = Account | undefined,
  >(
    client: Client<transport, chain, account>,
  ): KeyspaceActions => {
    return {
      getKeyspaceProof: (parameters) => getKeyspaceProof(client, parameters),
    };
  }
}
