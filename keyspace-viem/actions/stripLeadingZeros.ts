import { Hex } from "viem";

export function stripLeadingZeros(hex: Hex): Hex {
  return hex.replace(/^0x0+/, "0x") as Hex;
}
