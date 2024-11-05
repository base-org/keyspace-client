import {
  Address,
  encodePacked,
  fromHex,
  keccak256,
  type Hex,
} from "viem";

export function getInitialValueHash(controller: Address, storageHash: Hex): Hex {
  return getValueHash(controller, 0n, storageHash);
}

function getValueHash(controller: Address, nonce: bigint, storageHash: Hex): Hex {
  const preimage = encodePacked(
    ["address", "uint96", "uint256"],
    [controller, nonce, fromHex(storageHash, "bigint")]
  );
  return keccak256(preimage);
}
