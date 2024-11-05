import {
  encodePacked,
  type Hex,
  toHex,
  fromHex,
} from "viem";
import { SignReturnType } from "viem/accounts";
import { serializePublicKeyFromBytes } from "./keys";
import { encodeSignature, wrapSignature } from "../../user-op";


export function buildDummySignature() {
  const dummyPublicKey = new Uint8Array(65);
  dummyPublicKey[0] = 4;
  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodePackedSignature({
      r: "0x0000000000000000000000000000000000000000000000000000000000000000",
      s: "0x0000000000000000000000000000000000000000000000000000000000000000",
      v: 0n,
    })),
    ownerBytes: serializePublicKeyFromBytes(dummyPublicKey),
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
      parseInt((signature.v || 0).toString()),
    ],
  );
}
