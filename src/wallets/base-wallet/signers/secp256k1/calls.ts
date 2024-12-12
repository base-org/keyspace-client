import { Address, encodeAbiParameters, Hex } from "viem";

import { entryPointAddress } from "@generated";
import { getConfigDataForPrivateKey } from "./config-data";
import { buildUserOp, Call, getUserOpHash } from "@/wallets/base-wallet/user-op";
import { client, chain, bundlerClient } from "@scripts/lib/client";
import { signAndWrap } from "./sign";
import { encodeConfigData } from "@/wallets/base-wallet/config";
import { buildDummySignature } from "./signatures";
import { hashConfig, KeystoreConfig } from "@/config";

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

/**
 * Signs the authorization for a setConfig transaction.
 *
 * @param config - The new configuration data.
 * @param ownerIndex - The index of the owner.
 * @param privateKey - The private key object used for signing.
 * @returns A promise of the encoded authorization signature.
 */
export async function signSetConfigAuth({
  config,
  ownerIndex,
  privateKey,
}: {
  config: KeystoreConfig,
  ownerIndex: bigint,
  privateKey: Hex,
}) {
  const hash = hashConfig(config);
  const sigAuth = await signAndWrap({ hash, privateKey, ownerIndex });
  const sigUpdate = "0x";
  return encodeAbiParameters(
    [
      { type: "bytes", name: "sigAuth" },
      { type: "bytes", name: "sigUpdate" },
    ],
    [sigAuth, sigUpdate]
  )
}
