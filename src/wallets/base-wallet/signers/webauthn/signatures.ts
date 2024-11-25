import { base64urlnopad } from "@scure/base";
import { Hex, encodeAbiParameters, stringToHex } from "viem";
import { wrapSignature } from "../../user-op";


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

/**
 * Builds a dummy signature for estimating the gas cost of user operations.
 *
 * @returns {Uint8Array} The encoded dummy signature.
 */
export function buildDummySignature(): Hex {
  const challenge = new Uint8Array(32);
  return wrapSignature(0n, encodeWebAuthnAuth({
    r: 0n,
    s: 0n,
    clientDataJSON: `{"type":"webauthn.get","challenge":"${base64urlnopad.encode(challenge)}","origin":"https://keys.coinbase.com"}`,
    authenticatorData: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
  }));
}

/**
 * Encodes a WebAuthn signature into the WebAuthnAuth struct expected by the Base Wallet contracts.
 *
 * @param signature - The signature to encode.
 * @returns The encoded signature.
 */
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
