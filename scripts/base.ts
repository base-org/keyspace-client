import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, Hex, http, PublicClient } from "viem";
import { baseSepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");

import { entryPointAddress } from "../generated";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../index";
import { buildWebAuthnSignature, p256WebAuthnSign } from "../utils/signature";

const chain = baseSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

const jwk = JSON.parse(process.env.P256_JWK || "");
export const p256PrivateKey = ECDSA.fromJWK(jwk);
export const authenticatorData = "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000";

ECDSA;
export async function getAccount(): Promise<Address> {
  return await getAccountAddress(client as any, { owners: [p256PubKey()], nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
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
