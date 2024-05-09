import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, Hex, http, keccak256, fromHex, toHex } from "viem";
import { baseSepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");
import { entryPointAddress } from "../../../generated";
import { buildWebAuthnSignature, p256WebAuthnSign } from "../../../utils/signature";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../../../utils/smartWallet";
import { keyspaceActions } from "../../../keyspace-viem/decorators/keyspace";
import { serializePublicKeyFromPoint, getKeyspaceKey } from "../../../utils/keyspace";
import { GetProofReturnType } from "../../../keyspace-viem/actions/getKeyspaceProof";

const chain = baseSepolia;

type ECDSA = {
  x: Buffer,
  y: Buffer,
  sign: (message: string, format: string) => Buffer,
};

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
export const vkHashWebAuthnAccount = "0x3cfd9ed759df30f84356c8de1447d2bc3201cc5458fd237968135dfa27493a7d";

export async function getAccount(): Promise<Address> {
  return await getAccountAddress(client as any, { owners: [p256PubKey()], nonce: 0n });
}

export function getDataHash(privateKey: ECDSA): Hex {
  const publicKey = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  const fullHash = keccak256(publicKey);
  const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);
  return toHex(truncatedHash);
}

export async function getKeyspaceStateProof(): Promise<GetProofReturnType> {
  const dataHash = getDataHash(p256PrivateKey);
  const keyspaceKey = getKeyspaceKey(vkHashWebAuthnAccount, dataHash);
  const keyspaceProof = await keyspaceClient.getKeyspaceProof({
    key: keyspaceKey,
    vkHash: vkHashWebAuthnAccount,
    dataHash,
  });
  console.log(keyspaceProof);
  return keyspaceProof;
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const keyspaceProof = await getKeyspaceStateProof();
  // TODO: Include the keyspace proof in the user operation once the contracts
  // support it.

  const account = await getAccount();
  const op = await buildUserOp(client, {
    account,
    signers: [p256PubKey()],
    calls,
    paymasterAndData: paymasterData,
  });

  op.verificationGasLimit = 800000n;

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });

  const { r, s, clientDataJSON } = p256WebAuthnSign({
    challenge: hash,
    authenticatorData,
    p256PrivateKey,
  });

  const signatureWrapper = buildWebAuthnSignature({
    ownerIndex: 0n,
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });
  op.signature = signatureWrapper;

  const opHash = await client.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}

export function p256PubKey() {
  const xBuffer = Buffer.from(jwk.x, "base64");
  const xHex = `0x${xBuffer.toString("hex")}` as Hex;
  const yBuffer = Buffer.from(jwk.y, "base64");
  const yHex = `0x${yBuffer.toString("hex")}` as Hex;

  return encodeAbiParameters(
    [{ type: "bytes32" }, { type: "bytes32" }],
    [xHex, yHex],
  );
}
