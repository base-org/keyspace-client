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
  fromHex,
  toHex,
} from "viem";
import { sign, SignReturnType } from "viem/accounts";
import { WebAuthnAuthStruct } from "./signature";
import { poseidonPerm } from "@zk-kit/poseidon-cipher";
import { secp256k1 } from "@noble/curves/secp256k1";


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
  // configuration for BN254 in mdehoog/poseidon.
  const hash = poseidon([fromHex(vkHash, "bigint"), fromHex(dataHash, "bigint")]);
  return toHex(hash);
}

export function serializePublicKeyFromPrivateKey(privateKey: Hex): Uint8Array {
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  return serializePublicKey(publicKey);
}

export function serializePublicKeyFromPoint(x: Buffer, y: Buffer): Uint8Array {
  const publicKey = Buffer.concat([Buffer.from([4]), x, y]);
  return serializePublicKey(publicKey);
}

/**
 * Pack a public key into the 256 byte Keyspace data record expected by the
 * EcsdaAccount circuit.
 */
export function serializePublicKey(publicKey: Uint8Array): Uint8Array {
  const encodingByte = publicKey.slice(0, 1);
  if (encodingByte[0] !== 4) {
    throw new Error("Invalid public key encoding");
  }

  const publicKeyX = publicKey.slice(1, 33);
  const publicKeyY = publicKey.slice(33, 65);

  const keyspaceData = new Uint8Array(256);
  keyspaceData.set(publicKeyX, 0);
  keyspaceData.set(publicKeyY, 32);
  return keyspaceData;
}
