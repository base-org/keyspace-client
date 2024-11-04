import {
  encodeAbiParameters,
  encodePacked,
  type Hex,
  hexToBigInt,
  toHex,
  fromHex,
  Address,
  signatureToCompactSignature,
} from "viem";
import { SignReturnType } from "viem/accounts";
import { getKeystoreID, getPublicKeyPoint, serializePublicKeyFromBytes, serializePublicKeyFromPrivateKey } from "../keyspace";
import { dummyConfigProof, getStorage, getStorageHash } from "./utils";
import { wrapSignature } from "../smart-wallet";


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
    confirmedValueHashStorageProof: [],
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
  confirmedValueHashStorageProof,
}: {
  signature: SignReturnType;
  publicKey: Uint8Array;
  confirmedValueHashStorageProof: Hex[];
}): Hex {
  const signatureWrapper = wrapSignature(0n, encodePackedSignature(signature));
  const ownerBytes = serializePublicKeyFromBytes(publicKey);
  const recordData = getStorage(ownerBytes);
  console.log(`sig = ${signatureWrapper}`);
  console.log(`recordData = ${recordData}`);
  console.log(`confirmedValueHashStorageProof = ${JSON.stringify(confirmedValueHashStorageProof, null, 2)}`);
  const userOpSig = encodeAbiParameters([{
    components: [
      { name: "sig", type: "bytes" },
      { name: "recordData", type: "bytes" },
      { name: "confirmedValueHashStorageProof", type: "bytes[]" },
      { name: "useAggregator", type: "bool" },
    ],
    type: "tuple",
  }], [{
    sig: signatureWrapper,
    recordData,
    confirmedValueHashStorageProof,
    useAggregator: false,
  }]);
  console.log(`userOpSig = ${userOpSig}`);
  return userOpSig;
}

export function getStorageHashForPrivateKey(privateKey: Hex): Hex {
  const ownerBytes = serializePublicKeyFromPrivateKey(privateKey);
  return getStorageHash(ownerBytes);
}

export function getKeystoreIDForPrivateKey(privateKey: Hex, controller: Address): Hex {
  const storageHash = getStorageHashForPrivateKey(privateKey);
  return getKeystoreID(controller, storageHash);
}

