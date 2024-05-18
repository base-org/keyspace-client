import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, Hex, http, keccak256, fromHex, toHex } from "viem";
import { baseSepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");
import { entryPointAddress } from "../../../generated";
import { signAndWrapWebAuthn, type ECDSA } from "../../../utils/signature";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../../../utils/smartWallet";
import { keyspaceActions } from "../../../keyspace-viem/decorators/keyspace";
import { serializePublicKeyFromPoint, getKeyspaceKey, getKeyspaceConfigProof } from "../../../utils/keyspace";
import { GetConfigProofReturnType } from "../../../keyspace-viem/actions/types";

const chain = baseSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
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


export function getKeyspaceKeyForPrivateKey(privateKey: string): Hex {
  const jwk = JSON.parse(privateKey);
  const p256PrivateKey: ECDSA = ECDSA.fromJWK(jwk);
  const dataHash = getDataHash(p256PrivateKey);
  return getKeyspaceKey(vkHashWebAuthnAccount, dataHash);
}

export async function getAccount(privateKey: string): Promise<Address> {
  const keyspaceKey = getKeyspaceKeyForPrivateKey(privateKey);
  const owners = [{
    ksKeyType: 2,
    ksKey: fromHex(keyspaceKey, "bigint"),
  }];
  return await getAccountAddress(client as any, { owners, nonce: 0n });
}

export function getDataHash(privateKey: ECDSA): Hex {
  const publicKey = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  const fullHash = keccak256(publicKey);
  const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);
  return toHex(truncatedHash);
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const dataHash = getDataHash(p256PrivateKey);
  const keyspaceKey = getKeyspaceKey(vkHashWebAuthnAccount, dataHash);
  const keyspaceProof = await getKeyspaceConfigProof(keyspaceKey, dataHash);

  const account = await getAccount(process.env.P256_JWK as string);
  const op = await buildUserOp(client, {
    account,
    signers: [{
      ksKeyType: 2,
      ksKey: fromHex(keyspaceKey, "bigint"),
    }],
    calls,
    paymasterAndData: paymasterData,
  });

  op.verificationGasLimit = 800000n;

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrapWebAuthn({ hash, privateKey: p256PrivateKey, ownerIndex: 0n, authenticatorData });

  const opHash = await client.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}
