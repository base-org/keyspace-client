import {
  encodeAbiParameters,
  encodePacked,
  type Hex,
  hexToBigInt,
} from "viem";
import { SignReturnType } from "viem/accounts";
import { getPublicKeyPoint } from "../keyspace";
import { buildSignatureWrapper } from "./utils";


export const SignatureWrapperStruct = {
  components: [
    {
      name: "ksKey",
      type: "uint256",
    },
    {
      name: "signatureData",
      type: "bytes",
    }
  ],
  name: "SignatureWrapper",
  type: "tuple",
};

export function buildDummySignature({ keyspaceKey }: { keyspaceKey: Hex }) {
  const dummyPublicKey = new Uint8Array(65);
  dummyPublicKey[0] = 4;
  return encodeSignatureWrapper({
    signature: {
      r: "0x0000000000000000000000000000000000000000000000000000000000000000",
      s: "0x0000000000000000000000000000000000000000000000000000000000000000",
      v: 0n,
    },
    keyspaceKey,
    publicKey: dummyPublicKey,
    configProof: "0x",
  });
}

export function encodePackedSignature(signature: SignReturnType): Hex {
  return encodePacked(
    ["bytes32", "bytes32", "uint8"],
    [
      signature.r,
      signature.s,
      parseInt(signature.v.toString()),
    ],
  );
}

export function encodeWitness(signature: SignReturnType, publicKeyX: Uint8Array, publicKeyY: Uint8Array, stateProof: Hex): Hex {
  return encodeAbiParameters([
    { name: "sig", type: "bytes" },
    { name: "publicKeyX", type: "uint256" },
    { name: "publicKeyY", type: "uint256" },
    { name: "stateProof", type: "bytes" },
  ], [
    encodePackedSignature(signature),
    hexToBigInt("0x" + Buffer.from(publicKeyX).toString("hex") as Hex),
    hexToBigInt("0x" + Buffer.from(publicKeyY).toString("hex") as Hex),
    stateProof,
  ])
}

export function encodeSignatureWrapper(
  { signature, keyspaceKey, publicKey, configProof }: { signature: SignReturnType; keyspaceKey: Hex, publicKey: Uint8Array, configProof: Hex },
): Hex {
  const publicKeyPoint = getPublicKeyPoint(publicKey);
  const signatureData = encodeWitness(signature, publicKeyPoint.x, publicKeyPoint.y, configProof);
  return buildSignatureWrapper({ signatureData, keyspaceKey });
}


