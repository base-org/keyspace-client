import { Hex } from "viem";

import { entryPointAddress } from "../../generated";
import { getStorageHash } from "../../src/encode-signatures/utils";
import { encodeSignature } from "../../src/encode-signatures/webauthn";
import { getAccount, getConfirmedValueHashStorageProof, serializePublicKeyFromPoint } from "../../src/keyspace";
import { p256WebAuthnSign } from "../../src/sign";
import { buildUserOp, Call, getUserOpHash } from "../../src/smart-wallet";
import { bundlerClient, chain, client } from "./client";
export const ECDSA = require("ecdsa-secp256r1");

export type ECDSA = {
  x: Buffer,
  y: Buffer,
  sign: (message: string, format: string) => Buffer,
};

const jwk = JSON.parse(process.env.P256_JWK || "");
export const p256PrivateKey: ECDSA = ECDSA.fromJWK(jwk);
export const authenticatorData = "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000";
// This verification key is not production-ready because it uses a locally
// generated KZG commitment instead of one with a trusted setup.
export const vkHashWebAuthnAccount = "0x8035f6d10fc783cfb1b0f9392dff5b6bc3f3665e47b36374c19624e9675cd8";

export async function makeCalls(keyspaceKey: Hex, privateKey: ECDSA, calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount(client, keyspaceKey, 0n, "webauthn");
  const op = await buildUserOp(client, {
    account,
    ksKey: keyspaceKey,
    ksKeyType: 2,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "webauthn",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({ hash, privateKey, keyspaceKey });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}

export async function signAndWrap(
  { hash, privateKey, keyspaceKey }: { hash: Hex; privateKey: ECDSA; keyspaceKey: Hex }
): Promise<Hex> {
  const signature = await p256WebAuthnSign({
    challenge: hash,
    authenticatorData,
    p256PrivateKey: privateKey,
  });
  const pk256 = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  const dataHash = getStorageHash(pk256);
  const configProof = await getConfirmedValueHashStorageProof(keyspaceClient, keyspaceKey, vkHashWebAuthnAccount, dataHash);
  return encodeSignature({
    signature,
    publicKey: {
      x: privateKey.x,
      y: privateKey.y,
    },
    configProof: configProof.proof,
  });
}
