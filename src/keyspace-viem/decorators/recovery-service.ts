import { Account, Chain, Client, Transport } from "viem";
import { getSignatureProof } from "../actions/getSignatureProof";
import { GetSignatureProofParameters, GetSignatureProofReturnType } from "../actions/types";

export type RecoveryServiceActions = {
  getSignatureProof: (parameters: GetSignatureProofParameters) => Promise<GetSignatureProofReturnType>;
}

export function recoveryServiceActions() {
  return <
    transport extends Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends Account | undefined = Account | undefined,
  >(
    client: Client<transport, chain, account>,
  ): RecoveryServiceActions => {
    return {
      getSignatureProof: (parameters) => getSignatureProof(client, parameters),
    };
  }
}
