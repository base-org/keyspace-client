import { Account, Chain, Client, Hex, Transport } from "viem";
import { GetRawHeaderParameters } from "../actions/types";
import { getRawHeader } from "../actions/getRawHeader";

export type DebugActions = {
  getRawHeader: (parameters: GetRawHeaderParameters) => Promise<Hex>;
}

export function debugActions() {
  return <
    transport extends Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends Account | undefined = Account | undefined,
  >(
    client: Client<transport, chain, account>,
  ): DebugActions => {
    return {
      getRawHeader: (parameters) => getRawHeader(client, parameters),
    };
  }
}
