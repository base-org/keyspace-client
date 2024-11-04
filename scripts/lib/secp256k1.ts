import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex } from "viem";
import { sign } from "viem/accounts";

import { entryPointAddress } from "../../generated";
import { encodeSignature, getStorageHashForPrivateKey } from "../../src/encode-signatures/secp256k1";
import { getStorageHash } from "../../src/encode-signatures/utils";
import { getAccount, getConfirmedValueHashStorageProof, serializePublicKeyFromBytes } from "../../src/keyspace";
import { buildUserOp, Call, controllerAddress, getAddress, getUserOpHash } from "../../src/smart-wallet";
import { client, chain, bundlerClient, l1Client, masterClient } from "./client";

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

export async function signAndWrap(
  { hash, privateKey, keystoreID }: { hash: Hex; privateKey: Hex; keystoreID: Hex }
): Promise<Hex> {
  const signature = await sign({ hash, privateKey });
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  const confirmedValueHashStorageProof = await getConfirmedValueHashStorageProof(
    l1Client, masterClient, client, keystoreID);
  return encodeSignature({
    signature,
    publicKey,
    confirmedValueHashStorageProof,
  });
}
