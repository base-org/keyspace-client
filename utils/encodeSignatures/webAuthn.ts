import { base64urlnopad } from "@scure/base";
import { Hex, encodeAbiParameters, stringToHex, hexToBytes, hexToBigInt } from "viem";
import { buildSignatureWrapper } from "./utils";


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

export function buildDummySignature({ keyspaceKey }: { keyspaceKey: Hex; }): Hex {
  const challenge = new Uint8Array(32);
  return encodeSignatureWrapper({
    signature: {
      r: 0n,
      s: 0n,
      clientDataJSON: `{"type":"webauthn.get","challenge":"${base64urlnopad.encode(challenge)}","origin":"https://keys.coinbase.com"}`,
      authenticatorData: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
    },
    keyspaceKey,
    publicKey: {
      x: new Uint8Array(32),
      y: new Uint8Array(32),
    },
    configProof: "0x",
  });
}

export function encodeWitness(webAuthnAuth: Hex, publicKeyX: Uint8Array, publicKeyY: Uint8Array, stateProof: Hex): Hex {
  return encodeAbiParameters([
    { name: "sig", type: "bytes" },
    { name: "publicKeyX", type: "uint256" },
    { name: "publicKeyY", type: "uint256" },
    { name: "stateProof", type: "bytes" },
  ], [
    webAuthnAuth,
    hexToBigInt("0x" + Buffer.from(publicKeyX).toString("hex") as Hex),
    hexToBigInt("0x" + Buffer.from(publicKeyY).toString("hex") as Hex),
    stateProof,
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

export function encodeSignatureWrapper(
  { signature, keyspaceKey, publicKey, configProof }: { signature: WebAuthnSignature; keyspaceKey: Hex; publicKey: { x: Uint8Array; y: Uint8Array; }; configProof: Hex; }
): Hex {
  const webAuthnAuth = encodeWebAuthnAuth(signature);
  const signatureData = encodeWitness(webAuthnAuth, publicKey.x, publicKey.y, configProof);
  return buildSignatureWrapper({ signatureData, keyspaceKey });
}



