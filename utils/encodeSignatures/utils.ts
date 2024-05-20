import {
  type Hex, keccak256,
  fromHex,
  toHex,
  encodeAbiParameters
} from "viem";
import { SignatureWrapperStruct } from "./secp256k1";


export function getDataHash(serializedPublicKey: Uint8Array): Hex {
  const fullHash = keccak256(serializedPublicKey);
  const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);
  return toHex(truncatedHash);
}

export function buildSignatureWrapper({ signatureData, keyspaceKey }: { signatureData: Hex; keyspaceKey: Hex; }): Hex {
  return encodeAbiParameters(
    [SignatureWrapperStruct],
    [
      {
        ksKey: keyspaceKey,
        signatureData,
      },
    ]
  );
}

