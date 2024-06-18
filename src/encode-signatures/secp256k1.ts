import {
  encodeAbiParameters,
  encodePacked,
  type Hex,
  hexToBigInt,
  toHex,
  fromHex,
} from "viem";
import { SignReturnType } from "viem/accounts";
import { getKeyspaceKey, getPublicKeyPoint, serializePublicKeyFromPrivateKey } from "../keyspace";
import { dummyConfigProof, getDataHash } from "./utils";


export function buildDummySignature() {
  const dummyPublicKey = new Uint8Array(65);
  dummyPublicKey[0] = 4;
  return encodeSignature({
    signature: {
      r: "0x0000000000000000000000000000000000000000000000000000000000000000",
      s: "0x0000000000000000000000000000000000000000000000000000000000000000",
      v: 0n,
    },
    publicKey: dummyPublicKey,
    configProof: dummyConfigProof,
  });
}

export function encodePackedSignature(signature: SignReturnType): Hex {
  return encodePacked(
    ["bytes32", "bytes32", "uint8"],
    [
      // Viem's sign function returns Hex values for r and s without specifying,
      // a size, which occasionally produces 63-character Hex values that
      // encodePacked will reject.
      toHex(fromHex(signature.r, "bigint"), { size: 32 }),
      toHex(fromHex(signature.s, "bigint"), { size: 32 }),
      parseInt(signature.v.toString()),
    ],
  );
}

export function encodeSignature({
  signature,
  publicKey,
  configProof,
}: {
  signature: SignReturnType;
  publicKey: Uint8Array;
  configProof: Hex;
}): Hex {
  const publicKeyPoint = getPublicKeyPoint(publicKey);
  return encodeAbiParameters([
    { name: "sig", type: "bytes" },
    { name: "publicKeyX", type: "uint256" },
    { name: "publicKeyY", type: "uint256" },
    { name: "stateProof", type: "bytes" },
  ], [
    encodePackedSignature(signature),
    hexToBigInt("0x" + Buffer.from(publicKeyPoint.x).toString("hex") as Hex),
    hexToBigInt("0x" + Buffer.from(publicKeyPoint.y).toString("hex") as Hex),
    configProof,
  ])
}

export function getDataHashForPrivateKey(privateKey: Hex): Hex {
  const pk256 = serializePublicKeyFromPrivateKey(privateKey);
  return getDataHash(pk256);
}

export function getKeyspaceKeyForPrivateKey(privateKey: Hex, vkHash: Hex): Hex {
  const dataHash = getDataHashForPrivateKey(privateKey);
  return getKeyspaceKey(vkHash, dataHash);
}

