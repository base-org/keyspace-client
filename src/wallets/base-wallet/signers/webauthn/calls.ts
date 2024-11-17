import { Hex } from "viem";
const P256 = require("ecdsa-secp256r1");

import { entryPointAddress } from "../../../../../generated";
import { getConfigDataForPrivateKey } from "./config-data";
import { P256PrivateKey, signAndWrap } from "./sign";
import { buildUserOp, Call, getUserOpHash } from "../../user-op";
import { bundlerClient, chain, client } from "../../../../../scripts/lib/client";

const jwk = JSON.parse(process.env.P256_JWK || "");
export const p256PrivateKey: P256PrivateKey = P256.fromJWK(jwk);


/**
 * Creates and sends a Base Wallet user operation signed with a WebAuthn/P256 private key.
 *
 * @param keystoreID - The hexadecimal ID of the keystore.
 * @param privateKey - The private key object used for signing.
 * @param calls - An array of calls to be executed.
 * @param paymasterData - Optional hexadecimal data for the paymaster. Defaults to "0x".
 * @returns A promise of the user operation hash.
 */
export async function makeCalls(keystoreID: Hex, privateKey: P256PrivateKey, calls: Call[], paymasterData = "0x" as Hex) {
  const initialConfigData = getConfigDataForPrivateKey(privateKey);
  const op = await buildUserOp(client, {
    initialConfigData,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "webauthn",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({ hash, privateKey, keystoreAddress: op.sender });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}
