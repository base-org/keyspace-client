import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex } from "viem";
import { sign } from "viem/accounts";

import { entryPointAddress } from "../../generated";
import { encodePackedSignature } from "../../src/wallets/base-wallet/signers/secp256k1/signatures";
import { getStorageHashForPrivateKey } from "../../src/wallets/base-wallet/signers/secp256k1/storage";
import { encodeSignature, wrapSignature } from "../../src/wallets/base-wallet/user-op";
import { getConfirmedValueHashStorageProof } from "../../src/proofs";
import { buildUserOp, Call, controllerAddress, getUserOpHash } from "../../src/wallets/base-wallet/user-op";
import { client, chain, bundlerClient, l1Client, masterClient } from "./client";
import { serializePublicKeyFromBytes } from "../../src/wallets/base-wallet/signers/secp256k1/keys";

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
    signatureWrapper: wrapSignature(0n, encodePackedSignature(signature)),
    ownerBytes: serializePublicKeyFromBytes(publicKey),
    confirmedValueHashStorageProof,
  });
}
