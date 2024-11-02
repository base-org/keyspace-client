import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex } from "viem";
import { sign } from "viem/accounts";

import { entryPointAddress } from "../../generated";
import { encodeSignature } from "../../src/encode-signatures/secp256k1";
import { getStorageHash } from "../../src/encode-signatures/utils";
import { getAccount, getKeyspaceConfigProof, serializePublicKeyFromBytes } from "../../src/keyspace";
import { buildUserOp, Call, getUserOpHash } from "../../src/smart-wallet";
import { client, chain, bundlerClient, keyspaceClient } from "./client";

// This verification key is not production-ready because it uses a locally
// generated KZG commitment instead of one with a trusted setup.
export const vkHashEcdsaAccount = "0xe513408e896618fd2b4877b44ecc81e6055647f6abb48e0356384fc63b2f72";

export async function makeCalls(keyspaceKey: Hex, privateKey: Hex, calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount(client, keyspaceKey, 0n, "secp256k1");
  const op = await buildUserOp(client, {
    account,
    ksKey: keyspaceKey,
    ksKeyType: 1,
    calls,
    paymasterAndData: paymasterData,
    signatureType: "secp256k1",
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrap({
    hash,
    privateKey,
    keyspaceKey,
  });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}

export async function signAndWrap(
  { hash, privateKey, keyspaceKey }: { hash: Hex; privateKey: Hex; keyspaceKey: Hex }
): Promise<Hex> {
  const signature = await sign({ hash, privateKey });
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  const pk256 = serializePublicKeyFromBytes(publicKey);
  const dataHash = getStorageHash(pk256);
  const configProof = await getKeyspaceConfigProof(keyspaceClient, keyspaceKey, vkHashEcdsaAccount, dataHash);  return encodeSignature({
    signature,
    publicKey,
    configProof: configProof.proof,
  });
}
