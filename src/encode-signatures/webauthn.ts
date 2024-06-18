import { base64urlnopad } from "@scure/base";
import { Hex, encodeAbiParameters, hexToBigInt, stringToHex } from "viem";
import { getKeyspaceKey, serializePublicKeyFromPoint } from "../keyspace";
import { dummyConfigProof, getDataHash } from "./utils";


export interface WebAuthnSignature {
  r: bigint;
  s: bigint;
  clientDataJSON: string;
  authenticatorData: string;
}

export const WebAuthnAuthStruct = {
  components: [
    {
      name: "authenticatorData",
      type: "bytes",
    },
    { name: "clientDataJSON", type: "bytes" },
    { name: "challengeIndex", type: "uint256" },
    { name: "typeIndex", type: "uint256" },
    {
      name: "r",
      type: "uint256",
    },
    {
      name: "s",
      type: "uint256",
    },
  ],
  name: "WebAuthnAuth",
  type: "tuple",
};

export function buildDummySignature(): Hex {
  const challenge = new Uint8Array(32);
  return encodeSignature({
    signature: {
      r: 0n,
      s: 0n,
      clientDataJSON: `{"type":"webauthn.get","challenge":"${base64urlnopad.encode(challenge)}","origin":"https://keys.coinbase.com"}`,
      authenticatorData: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
    },
    publicKey: {
      x: new Uint8Array(32),
      y: new Uint8Array(32),
    },
    configProof: dummyConfigProof,
  });
}

export function encodeSignature({
  signature,
  publicKey,
  configProof,
}: {
  signature: WebAuthnSignature;
  publicKey: { x: Uint8Array; y: Uint8Array; };
  configProof: Hex; }
): Hex {
  return encodeAbiParameters([
    { name: "sig", type: "bytes" },
    { name: "publicKeyX", type: "uint256" },
    { name: "publicKeyY", type: "uint256" },
    { name: "stateProof", type: "bytes" },
  ], [
    encodeWebAuthnAuth(signature),
    hexToBigInt("0x" + Buffer.from(publicKey.x).toString("hex") as Hex),
    hexToBigInt("0x" + Buffer.from(publicKey.y).toString("hex") as Hex),
    configProof,
  ]);
}

export function encodeWebAuthnAuth(
  { authenticatorData, clientDataJSON, r, s }: WebAuthnSignature
) {
  const challengeIndex = clientDataJSON.indexOf("\"challenge\":");
  const typeIndex = clientDataJSON.indexOf("\"type\":");

  return encodeAbiParameters(
    [WebAuthnAuthStruct],
    [
      {
        authenticatorData,
        clientDataJSON: stringToHex(clientDataJSON),
        challengeIndex,
        typeIndex,
        r,
        s,
      },
    ]
  );
}

export function getDataHashForPrivateKey(privateKey: any): Hex {
  const pk256 = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  return getDataHash(pk256);
}

export function getKeyspaceKeyForPrivateKey(privateKey: any, vkHash: Hex): Hex {
  const dataHash = getDataHashForPrivateKey(privateKey);
  return getKeyspaceKey(vkHash, dataHash);
}

