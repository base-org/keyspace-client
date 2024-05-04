import { base64urlnopad } from "@scure/base";
import {
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  type Hex,
  hexToBigInt,
  hexToBytes,
  sha256,
  stringToBytes,
  stringToHex,
} from "viem";
import { sign, SignReturnType } from "viem/accounts";
import { WebAuthnAuthStruct } from "./signature";


const KeyspaceSignatureWrapperStruct = {
  components: [
    {
      name: "ownerIndex",
      type: "uint8",
    },
    {
      name: "signatureData",
      type: "bytes",
    },
    {
      name: "stateProof",
      type: "bytes",
    }
  ],
  name: "KeyspaceSignatureWrapper",
  type: "tuple",
};

type BuildUserOperationParams = {
  ownerIndex: bigint;
  authenticatorData: string;
  clientDataJSON: string;
  r: bigint;
  s: bigint;
  stateProof: string;
};

export function buildDummyKeyspaceSignature({ ownerIndex, challenge }: { ownerIndex: bigint; challenge: Hex }): Hex {
  const signatureData = encodeAbiParameters(
    [WebAuthnAuthStruct],
    [
      {
        authenticatorData: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
        clientDataJSON: stringToHex(
          `{"type":"webauthn.get","challenge":"${
            base64urlnopad.encode(hexToBytes(challenge))
          }","origin":"https://keys.coinbase.com"}`,
        ),
        challengeIndex: 1n,
        typeIndex: 23n,
        r: 0n,
        s: 0n,
      },
    ],
  );
  return encodeAbiParameters(
    [KeyspaceSignatureWrapperStruct],
    [
      {
        ownerIndex,
        signatureData,
        stateProof: "0x",
      },
    ],
  );
}

export function buildKeyspaceWebAuthnSignature({
  ownerIndex,
  authenticatorData,
  clientDataJSON,
  r,
  s,
  stateProof,
}: BuildUserOperationParams): Hex {
  const challengeIndex = clientDataJSON.indexOf("\"challenge\":");
  const typeIndex = clientDataJSON.indexOf("\"type\":");

  const keyspaceWebAuthnAuthBytes = encodeAbiParameters(
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
    ],
  );

  return encodeAbiParameters(
    [KeyspaceSignatureWrapperStruct],
    [
      {
        ownerIndex,
        signatureData: keyspaceWebAuthnAuthBytes,
        stateProof,
      },
    ],
  );
}
