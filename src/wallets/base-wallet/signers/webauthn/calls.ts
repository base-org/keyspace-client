import { Address, encodeAbiParameters, Hex } from "viem";
const P256 = require("ecdsa-secp256r1");

import { entryPointAddress } from "@generated";
import { getConfigDataForPrivateKey } from "./config-data";
import { P256PrivateKey, signAndWrap } from "./sign";
import { buildUserOp, Call, getUserOpHash } from "@/wallets/base-wallet/user-op";
import { bundlerClient, chain, client } from "@scripts/lib/client";
import { encodeConfigData } from "@/wallets/base-wallet/config";
import { buildDummySignature } from "./signatures";
import { hashConfig, KeystoreConfig } from "@/config";

const jwk = JSON.parse(process.env.P256_JWK || "");
export const p256PrivateKey: P256PrivateKey = P256.fromJWK(jwk);

export type MakeCallsParameters = {
  account: Address;
  ownerIndex: bigint;
  calls: Call[];
  paymasterAndData?: Hex;
  initialConfigData?: Hex;
  privateKey: P256PrivateKey;
}

/**
 * Creates and sends a Base Wallet user operation signed with a WebAuthn/P256 private key.
 *
 * @param keystoreID - The hexadecimal ID of the keystore.
 * @param privateKey - The private key object used for signing.
 * @param calls - An array of calls to be executed.
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
  op.signature = await signAndWrap({ hash, privateKey, ownerIndex });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
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
  privateKey: P256PrivateKey,
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
