import { encodePacked, Hex, keccak256 } from "viem";


export function encodeConfig(nonce: bigint, data: Hex): Hex {
  const preimage = encodePacked(
    ["uint256", "bytes"],
    [nonce, data]
  );
  return keccak256(preimage);
}

export function hashConfig(nonce: bigint, data: Hex): Hex {
  return keccak256(encodeConfig(nonce, data));
}
