import { Hex, toHex } from "viem";

export function serializePublicKeyFromPoint(x: Uint8Array, y: Uint8Array): Hex {
  const keyspaceData = new Uint8Array(64);
  keyspaceData.set(x, 0);
  keyspaceData.set(y, 32);
  return toHex(keyspaceData);
}

export function getPublicKeyPoint(publicKey: Uint8Array): { x: Uint8Array; y: Uint8Array; } {
  const encodingByte = publicKey.slice(0, 1);
  if (encodingByte[0] !== 4) {
    throw new Error("Invalid public key encoding");
  }

  return {
    x: publicKey.slice(1, 33),
    y: publicKey.slice(33, 65),
  };
}
