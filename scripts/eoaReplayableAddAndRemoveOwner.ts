import { decodeAbiParameters, encodeFunctionData, Hex } from "viem";
import { accountAbi } from "../generated";
import { p256PubKey } from "./base";
import { abiEncodedEOA, makeReplayableCalls } from "./eoaBase";

function main() {
  const [x, y] = decodeAbiParameters([{ type: "bytes32" }, { type: "bytes32" }], p256PubKey());
  const calls: Hex[] = [
    encodeFunctionData({
      abi: accountAbi,
      functionName: "addOwnerPublicKey",
      args: [x, y],
    }),
    encodeFunctionData({
      abi: accountAbi,
      functionName: "removeOwnerAtIndex",
      args: [0n, abiEncodedEOA],
    }),
  ];
  makeReplayableCalls(calls);
}

main();
