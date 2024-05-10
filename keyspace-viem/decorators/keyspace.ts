import { Account, Chain, Client, Transport } from "viem";
import { GetConfigProofParameters, GetConfigProofReturnType, GetRecoverProofParameters, GetRecoverProofReturnType, SetConfigParameters } from "../actions/types";
import { getConfigProof } from "../actions/getConfigProof";
import { getRecoverProof } from "../actions/getRecoverProof";
import { setConfig } from "../actions/setConfig";

export type KeyspaceActions = {
  getConfigProof: (parameters: GetConfigProofParameters) => Promise<GetConfigProofReturnType>;
  getRecoverProof: (parameters: GetRecoverProofParameters) => Promise<GetRecoverProofReturnType>;
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
      getRecoverProof: (parameters) => getRecoverProof(client, parameters),
      setConfig: (parameters) => setConfig(client, parameters),
    };
  }
}
