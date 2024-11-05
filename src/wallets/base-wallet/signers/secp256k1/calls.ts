import { Hex } from "viem";

import { entryPointAddress } from "../../../../../generated";
import { getStorageHashForPrivateKey } from "./storage";
import { buildUserOp, Call, controllerAddress, getUserOpHash } from "../../user-op";
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
export async function makeCalls(keystoreID: Hex, privateKey: Hex, calls: Call[], paymasterData = "0x" as Hex) {
  const storageHash = getStorageHashForPrivateKey(privateKey);
  const op = await buildUserOp(client, {
    // FIXME: This should actually use the account address for the provided
    // keystore ID, but the deployed CoinbaseSmartWallet implementation has a
    // getAddress that doesn't take the keystore ID.
    controller: controllerAddress,
    storageHash,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "secp256k1",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({
    hash,
    privateKey,
    keystoreID,
  });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  return opHash;
}
