import { Hex } from "viem";

import { entryPointAddress } from "../../../../../generated";
import { getStorageHashForPrivateKey } from "./storage";
import { buildUserOp, Call, controllerAddress, getUserOpHash } from "../../user-op";
import { client, chain, bundlerClient } from "../../../../../scripts/lib/client";
import { signAndWrap } from "./sign";

export async function makeCalls(keystoreID: Hex, privateKey: Hex, calls: Call[], paymasterData = "0x" as Hex) {
  const storageHash = getStorageHashForPrivateKey(privateKey);
  const op = await buildUserOp(client, {
    // FIXME: This should actually use the account address for the provided
    // keystore ID, but the deployed CoinbaseSmartWallet implementation has a
    // getAddress that doesn't take the keystore ID.
    controller: controllerAddress,
    storageHash,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "secp256k1",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({
    hash,
    privateKey,
    keystoreID,
  });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}
