import {
  Address,
  encodePacked,
  fromHex,
  keccak256,
  type Hex,
} from "viem";

/**
 * Computes the initial value hash for a given controller and storage hash.
 *
 * @param controller - The address of the record's controller.
 * @param storageHash - The hash of the storage value.
 * @returns The initial keystore value hash.
 */
export function getInitialValueHash(controller: Address, storageHash: Hex): Hex {
  return getValueHash(controller, 0n, storageHash);
}

/**
 * Computes the keystore value hash for the given record values.
 *
 * @param controller - The address of the record's controller.
 * @param nonce - The current incrementing nonce for the record.
 * @param storageHash - The hash of the storage value.
 * @returns The keystore value hash.
 */
function getValueHash(controller: Address, nonce: bigint, storageHash: Hex): Hex {
  const preimage = encodePacked(
    ["address", "uint96", "uint256"],
    [controller, nonce, fromHex(storageHash, "bigint")]
  );
  return keccak256(preimage);
}
