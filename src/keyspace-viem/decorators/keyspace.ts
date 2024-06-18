import { Account, Chain, Client, Transport } from "viem";
import { GetConfigProofParameters, GetConfigProofReturnType, SetConfigParameters } from "../actions/types";
import { getConfigProof } from "../actions/getConfigProof";
import { setConfig } from "../actions/setConfig";

export type KeyspaceActions = {
  getConfigProof: (parameters: GetConfigProofParameters) => Promise<GetConfigProofReturnType>;
  setConfig: (parameters: SetConfigParameters) => Promise<null>;
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
      getConfigProof: (parameters) => getConfigProof(client, parameters),
      setConfig: (parameters) => setConfig(client, parameters),
    };
  }
}
