import { type Hex, encodeAbiParameters, keccak256 } from "viem";


/**
 * Packs the owner bytes into the full Base Wallet keystore record format.
 *
 * @param ownerBytes - The hexadecimal representation of the owner's bytes.
 * @returns The encoded keystore record storage.
 */
export function getStorage(ownerBytes: Hex): Hex {
  return encodeAbiParameters([{
    components: [
      { name: "signers", type: "bytes[]" },
      { name: "sidecar", type: "bytes" },
    ],
    type: "tuple",
  }], [{
    signers: [ownerBytes],
    sidecar: "0x"
  }]);
}

/**
 * Computes the storage hash for a single given owner.
 *
 * @param ownerBytes - The hexadecimal representation of the owner's bytes.
 * @returns The hexadecimal representation of the storage hash.
 */
export function getStorageHash(ownerBytes: Hex): Hex {
  return keccak256(getStorage(ownerBytes));
}
