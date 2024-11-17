import { type Hex, encodeAbiParameters, keccak256 } from "viem";
import { hashConfig } from "../../config";


/**
 * Packs the owner bytes into the full Base Wallet keystore config data format.
 *
 * @param ownerBytes - The hexadecimal representation of a single owner's bytes.
 * @returns The encoded keystore record storage.
 */
export function encodeConfigData(ownerBytes: Hex): Hex {
  return encodeAbiParameters([{
    components: [
      { name: "signers", type: "bytes[]" },
    ],
    type: "tuple",
  }], [{
    signers: [ownerBytes],
  }]);
}

/**
 * Computes the config hash for a single given owner.
 *
 * @param ownerBytes - The hexadecimal representation of the owner's bytes.
 * @returns The hexadecimal representation of the config hash.
 */
export function getConfigHash(nonce: bigint, ownerBytes: Hex): Hex {
  return hashConfig(nonce, encodeConfigData(ownerBytes));
}
