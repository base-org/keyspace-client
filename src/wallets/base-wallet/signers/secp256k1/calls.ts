import { Address, Hex } from "viem";

import { entryPointAddress } from "../../../../../generated";
import { getConfigDataForPrivateKey } from "./config-data";
import { buildUserOp, Call, getUserOpHash } from "../../user-op";
import { client, chain, bundlerClient } from "../../../../../scripts/lib/client";
import { signAndWrap } from "./sign";
import { encodeConfigData } from "../../config";
import { buildDummySignature } from "./signatures";

export type MakeCallsParameters = {
  account: Address;
  ownerIndex: bigint;
  calls: Call[];
  paymasterAndData?: Hex;
  initialConfigData?: Hex;
  privateKey: Hex;
}

/**
 * Creates and sends a Base Wallet user operation signed with an secp256k1 private key.
 *
 * @param account - The address of the account.
 * @param calls - An array of calls to be executed.
 * @param privateKey - The hexadecimal private key used for signing.
 * @param paymasterData - Optional hexadecimal data for the paymaster. Defaults to "0x".
 * @returns A promise of the user operation hash.
 */
export async function makeCalls({ account, ownerIndex, calls, privateKey, paymasterAndData, initialConfigData }: MakeCallsParameters) {
  initialConfigData ??= encodeConfigData(getConfigDataForPrivateKey(privateKey));
  const op = await buildUserOp(client, {
    account,
    initialConfigData,
    calls,
    paymasterAndData: paymasterAndData ?? "0x",
    dummySignature: buildDummySignature(),
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({ hash, ownerIndex, privateKey });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  return opHash;
}
