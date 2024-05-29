import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, Hex, http, fromHex, Client } from "viem";
import { baseSepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");
import { entryPointAddress } from "../../../generated";
import { encodeSignatureWrapper } from "../../../utils/encodeSignatures/webAuthn";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../../../utils/smartWallet";
import { keyspaceActions } from "../../../keyspace-viem/decorators/keyspace";
import { serializePublicKeyFromPoint, getKeyspaceKey, getKeyspaceConfigProof, getAccount } from "../../../utils/keyspace";
import { p256WebAuthnSign } from "../../../utils/sign";
import { getDataHash } from "../../../utils/encodeSignatures/utils";

type ECDSA = {
  x: Buffer,
  y: Buffer,
  sign: (message: string, format: string) => Buffer,
};

const chain = baseSepolia;

export const client: Client = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
});

export const bundlerClient: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.BUNDLER_RPC_URL || "",
  ),
}).extend(bundlerActions);

export const keyspaceClient = createPublicClient({
  chain,
  transport: http(
    process.env.KEYSPACE_RPC_URL || "https://sepolia-alpha.key.space",
  ),
}).extend(keyspaceActions());

const jwk = JSON.parse(process.env.P256_JWK || "");
export const p256PrivateKey: ECDSA = ECDSA.fromJWK(jwk);
export const authenticatorData = "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000";
// This verification key is not production-ready because it uses a locally
// generated KZG commitment instead of one with a trusted setup.
export const vkHashWebAuthnAccount = "0x8035f6d10fc783cfb1b0f9392dff5b6bc3f3665e47b36374c19624e9675cd8";

export function getDataHashForPrivateKey(privateKey: ECDSA): Hex {
  const pk256 = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  return getDataHash(pk256);
}

export function getKeyspaceKeyForPrivateKey(privateKey: ECDSA): Hex {
  const dataHash = getDataHashForPrivateKey(privateKey);
  return getKeyspaceKey(vkHashWebAuthnAccount, dataHash);
}

export async function makeCalls(keyspaceKey: Hex, privateKey: ECDSA, calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount(keyspaceKey, 0n, "webauthn");
  const op = await buildUserOp(client, {
    account,
    signers: [{
      ksKeyType: 2,
      ksKey: fromHex(keyspaceKey, "bigint"),
    }],
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
  const dataHash = getDataHash(pk256);
  const configProof = await getKeyspaceConfigProof(keyspaceClient, keyspaceKey, vkHashWebAuthnAccount, dataHash);
  return encodeSignatureWrapper({
    signature,
    keyspaceKey,
    publicKey: {
      x: privateKey.x,
      y: privateKey.y,
    },
    configProof: configProof.proof,
  });
}
