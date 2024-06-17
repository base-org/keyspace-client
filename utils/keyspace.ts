import {
  type Hex,
  fromHex,
  toHex,
  Address,
} from "viem";
import { poseidonPerm } from "@zk-kit/poseidon-cipher";
import { secp256k1 } from "@noble/curves/secp256k1";
import { GetConfigProofReturnType, KeyspaceClient } from "../keyspace-viem/actions/types";
import { client } from "../scripts/keyspace/secp256k1/base";
import { getAccountAddress } from "./smartWallet";

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

export async function getAccount(ksKey: Hex, nonce: bigint, signatureType: "secp256k1" | "webauthn"): Promise<Address> {
  const ksKeyType = signatureType === "secp256k1" ? 1 : 2;
  return await getAccountAddress(client as any, { ksKey, ksKeyType, nonce });
}

