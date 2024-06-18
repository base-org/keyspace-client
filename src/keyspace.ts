import { secp256k1 } from "@noble/curves/secp256k1";
import { poseidonPerm } from "@zk-kit/poseidon-cipher";
import {
  Address,
  PublicClient,
  encodeAbiParameters,
  fromHex,
  keccak256,
  toHex,
  type Hex,
} from "viem";
import { sign } from "viem/accounts";
import { p256WebAuthnSign } from "../src/sign";
import { encodePackedSignature, getDataHashForPrivateKey as getDataHashSecp256k1 } from "./encode-signatures/secp256k1";
import { encodeWebAuthnAuth, getDataHashForPrivateKey as getDataHashWebAuthn } from "./encode-signatures/webauthn";
import { GetConfigProofReturnType, KeyspaceClient, RecoveryServiceClient } from "./keyspace-viem/actions/types";
import { getAccountAddress } from "./smart-wallet";
const ECDSA = require("ecdsa-secp256r1");

/**
 * Generate the poseidon hash of the inputs provided
 * @param inputs The inputs to hash
 * @returns the hash of the inputs
 * From https://github.com/privacy-scaling-explorations/maci/blob/2fe5c57/crypto/ts/hashing.ts
 */

export const poseidon = (inputs: bigint[]): bigint => poseidonPerm([BigInt(0), ...inputs.map((x) => BigInt(x))])[0];

export function getKeyspaceKey(vkHash: Hex, dataHash: Hex): Hex {
  // The poseidon hash function provided by viem's preferred @noble/curves
  // crypto library must be configured manually, and their example usage is not
  // clear.
  // https://github.com/paulmillr/scure-starknet/blob/3905471/index.ts#L329-L336
  // The configured hasher from @zk-kit/poseidon-cipher seems to match the
  // configuration for BN254 in mdehoog/poseidon, which should be a BW6-761
  // poseidon hash. That curve forms a 2-pair with the BLS12-377 curve used in
  // the TxHash proofs.
  const hash = poseidon([fromHex(vkHash, "bigint"), fromHex(dataHash, "bigint")]);
  return toHex(hash);
}

export function serializePublicKeyFromPoint(x: Uint8Array, y: Uint8Array): Uint8Array {
  const keyspaceData = new Uint8Array(256);
  keyspaceData.set(x, 0);
  keyspaceData.set(y, 32);
  return keyspaceData;
}

export function getPublicKeyPoint(publicKey: Uint8Array): { x: Uint8Array; y: Uint8Array } {
  const encodingByte = publicKey.slice(0, 1);
  if (encodingByte[0] !== 4) {
    throw new Error("Invalid public key encoding");
  }

  return {
    x: publicKey.slice(1, 33),
    y: publicKey.slice(33, 65),
  };
}

/**
 * Pack a public key into the 256 byte Keyspace data record expected by the
 * EcsdaAccount circuit.
 */
export function serializePublicKeyFromBytes(publicKey: Uint8Array): Uint8Array {
  const point = getPublicKeyPoint(publicKey);
  return serializePublicKeyFromPoint(point.x, point.y);
}

export function serializePublicKeyFromPrivateKey(privateKey: Hex): Uint8Array {
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  return serializePublicKeyFromBytes(publicKey);
}

export async function getKeyspaceConfigProof(client: KeyspaceClient, keyspaceKey: Hex, vkHash: Hex, dataHash: Hex): Promise<GetConfigProofReturnType> {
  const keyspaceProof = await client.getConfigProof({
    key: keyspaceKey,
    vkHash,
    dataHash,
  });
  console.log(keyspaceProof);
  return keyspaceProof;
}

export async function getAccount(client: PublicClient, ksKey: Hex, nonce: bigint, signatureType: "secp256k1" | "webauthn"): Promise<Address> {
  const ksKeyType = signatureType === "secp256k1" ? 1 : 2;
  return await getAccountAddress(client as any, { ksKey, ksKeyType, nonce });
}

export async function changeOwnerSecp256k1({
  keyspaceKey,
  currentPrivateKey,
  newPrivateKey,
  vkHash,
  keyspaceClient,
  recoveryClient,
}: {
  keyspaceKey: Hex;
  currentPrivateKey: Hex;
  newPrivateKey: Hex;
  vkHash: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const dataHash = getDataHashSecp256k1(newPrivateKey);
  const newKey = getKeyspaceKey(vkHash, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
  const signature = await sign({ hash: newKey254, privateKey: currentPrivateKey });
  const signatureData = encodePackedSignature(signature);
  performSetConfig({
    key: keyspaceKey,
    newKey,
    circuitType: "secp256k1",
    signatureData,
    keyspaceClient,
    recoveryClient,
  });
}

export async function changeOwnerWebAuthn({
  keyspaceKey,
  currentPrivateKey,
  newPrivateKey,
  vkHash,
  authenticatorData,
  keyspaceClient,
  recoveryClient,
}: {
  keyspaceKey: Hex;
  currentPrivateKey: any;
  newPrivateKey: any;
  vkHash: Hex;
  authenticatorData: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const dataHash = getDataHashWebAuthn(newPrivateKey);
  const newKey = getKeyspaceKey(vkHash, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
  const { r, s, clientDataJSON } = p256WebAuthnSign({
    challenge: newKey254,
    p256PrivateKey: currentPrivateKey,
    authenticatorData,
  });

  // Changing owners requires the current public key, which cannot be recovered
  // from the signature without its v value. Instead, the signature data is
  // packed as (bytes32,bytes32,bytes) to include the public key for
  // this operation. The final bytes argument contains an ABI-encoded
  // WebAuthnAuth.
  const webAuthnAuthEncoded = encodeWebAuthnAuth({
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });
  const signatureData = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes" }],
    [toHex(currentPrivateKey.x), toHex(currentPrivateKey.y), webAuthnAuthEncoded]
  );
  performSetConfig({
    key: keyspaceKey,
    newKey,
    circuitType: "webauthn",
    signatureData,
    keyspaceClient,
    recoveryClient,
  });
}

async function performSetConfig({
  key,
  newKey,
  circuitType,
  signatureData,
  keyspaceClient,
  recoveryClient,
}: {
  key: Hex;
  newKey: Hex;
  circuitType: "secp256k1" | "webauthn";
  signatureData: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const recoverResult = await recoveryClient.getSignatureProof({
    key,
    newKey,
    circuitType,
    signature: signatureData,
  });

  console.log("recovery_signatureProof succeeded", recoverResult);
  const fullHash = keccak256(recoverResult.currentVk, "bytes");
  const truncatedHash = fullHash.slice(0, 31);
  const vkHash = toHex(truncatedHash);
  console.log("vkHash", vkHash);

  await keyspaceClient.setConfig({
    key,
    newKey,
    ...recoverResult,
  });
}

