import { Hex } from "viem";

import { entryPointAddress } from "../../../../../generated";
import { getConfigDataForPrivateKey } from "./config-data";
import { buildUserOp, Call, getUserOpHash } from "../../user-op";
import { client, chain, bundlerClient } from "../../../../../scripts/lib/client";
import { signAndWrap } from "./sign";

/**
 * Creates and sends a Base Wallet user operation signed with an secp256k1 private key.
 *
 * @param keystoreID - The hexadecimal ID of the keystore.
 * @param privateKey - The hexadecimal private key used for signing.
 * @param calls - An array of calls to be executed.
 * @param paymasterData - Optional hexadecimal data for the paymaster. Defaults to "0x".
 * @returns A promise of the user operation hash.
 */
export async function makeCalls(privateKey: Hex, calls: Call[], paymasterData = "0x" as Hex) {
  const initialConfigData = getConfigDataForPrivateKey(privateKey);
  const op = await buildUserOp(client, {
    initialConfigData,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "secp256k1",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({
    hash,
    privateKey,
    keystoreAddress: op.sender,
  });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  return opHash;
}
