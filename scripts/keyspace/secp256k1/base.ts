import { bundlerActions, BundlerClient } from "permissionless";
import { Client, createPublicClient, fromHex, Hex, http, HttpTransportConfig } from "viem";
import { sign } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../../../generated";
import { buildUserOp, Call, getUserOpHash } from "../../../utils/smartWallet";
import { keyspaceActions } from "../../../keyspace-viem/decorators/keyspace";
import { getKeyspaceConfigProof, getKeyspaceKey, serializePublicKeyFromBytes, serializePublicKeyFromPrivateKey } from "../../../utils/keyspace";
import { encodeSignatureWrapper } from "../../../utils/encodeSignatures/secp256k1";
import { secp256k1 } from "@noble/curves/secp256k1";
import { getDataHash } from "../../../utils/encodeSignatures/utils";
import { getAccount } from "../../../utils/keyspace";
import { recoveryServiceActions } from "../../../keyspace-viem/decorators/recoveryService";

const chain = baseSepolia;

export const client: Client = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
});

export const bundlerClient: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.BUNDLER_RPC_URL || "",
  ),
}).extend(bundlerActions);

const keyspaceClientConfig: HttpTransportConfig = {
  // By default, viem will retry failed requests 3 times. It considers timeouts
  // as failures and will retry them as well.
  retryCount: 0,
  timeout: 120_000,
};

export const keyspaceClient = createPublicClient({
  chain,
  transport: http(
    process.env.KEYSPACE_RPC_URL || "https://sepolia-alpha.key.space",
    keyspaceClientConfig,
  ),
}).extend(keyspaceActions());

export const recoveryClient = createPublicClient({
  chain,
  transport: http(
    process.env.RECOVERY_RPC_URL || "http://localhost:8555",
    keyspaceClientConfig,
  ),
}).extend(recoveryServiceActions());

// This verification key is not production-ready because it uses a locally
// generated KZG commitment instead of one with a trusted setup.
export const vkHashEcdsaAccount = "0xe513408e896618fd2b4877b44ecc81e6055647f6abb48e0356384fc63b2f72";

export function getDataHashForPrivateKey(privateKey: Hex): Hex {
  const pk256 = serializePublicKeyFromPrivateKey(privateKey);
  return getDataHash(pk256);
}

export function getKeyspaceKeyForPrivateKey(privateKey: Hex): Hex {
  const dataHash = getDataHashForPrivateKey(privateKey);
  return getKeyspaceKey(vkHashEcdsaAccount, dataHash);
}

export async function makeCalls(keyspaceKey: Hex, privateKey: Hex, calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount(keyspaceKey, 0n, "secp256k1");
  const op = await buildUserOp(client, {
    account,
    signers: [{ ksKey: fromHex(keyspaceKey, "bigint"), ksKeyType: 1 }],
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
  const dataHash = getDataHash(pk256);
  const configProof = await getKeyspaceConfigProof(keyspaceClient, keyspaceKey, vkHashEcdsaAccount, dataHash);
  return encodeSignatureWrapper({
    signature,
    keyspaceKey,
    publicKey,
    configProof: configProof.proof,
  });
}
