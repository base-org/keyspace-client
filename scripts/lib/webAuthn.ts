import { Hex, toHex } from "viem";

import { entryPointAddress } from "../../generated";
import { encodeWebAuthnAuth } from "../../src/wallets/base-wallet/signers/webauthn/signatures";
import { getStorageHashForPrivateKey } from "../../src/wallets/base-wallet/signers/webauthn/storage";
import { serializePublicKeyFromPoint } from "../../src/wallets/base-wallet/signers/webauthn/keys";
import { getConfirmedValueHashStorageProof } from "../../src/proofs";
import { p256WebAuthnSign } from "../../src/wallets/base-wallet/signers/webauthn/sign";
import { buildUserOp, Call, controllerAddress, getUserOpHash, wrapSignature, encodeSignature } from "../../src/wallets/base-wallet/user-op";
import { bundlerClient, chain, client, l1Client, masterClient } from "./client";
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

export async function makeCalls(keystoreID: Hex, privateKey: ECDSA, calls: Call[], paymasterData = "0x" as Hex) {
  const storageHash = getStorageHashForPrivateKey(privateKey);
  const op = await buildUserOp(client, {
    // FIXME: This should actually use the account address for the provided
    // keystore ID, but the deployed CoinbaseSmartWallet implementation has a
    // getAddress that doesn't take the keystore ID.
    controller: controllerAddress,
    storageHash,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "webauthn",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({ hash, privateKey, keystoreID });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}

export async function signAndWrap(
  { hash, privateKey, keystoreID }: { hash: Hex; privateKey: ECDSA; keystoreID: Hex }
): Promise<Hex> {
  const signature = await p256WebAuthnSign({
    challenge: hash,
    authenticatorData,
    p256PrivateKey: privateKey,
  });
  const confirmedValueHashStorageProof = await getConfirmedValueHashStorageProof(
    l1Client, masterClient, client, keystoreID);

  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodeWebAuthnAuth(signature)),
    ownerBytes: serializePublicKeyFromPoint(privateKey.x, privateKey.y),
    confirmedValueHashStorageProof,
  });
}
