import { Hex } from "viem";

/**
 * Strip leading zeros from a hex string.
 * 
 * Values that the Go server handles as big.Ints must have leading zeros
 * stripped to deserialize without errors.
 */
export function stripLeadingZeros(hex: Hex): Hex {
  return hex.replace(/^0x0+/, "0x") as Hex;
}
