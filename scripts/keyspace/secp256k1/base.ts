import { bundlerActions, BundlerClient } from "permissionless";
import { Address, Client, createPublicClient, encodeAbiParameters, fromHex, Hex, http, HttpTransportConfig, keccak256, toHex } from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../../../generated";
import { signAndWrapEOA } from "../../../utils/signature";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../../../utils/smartWallet";
import { keyspaceActions } from "../../../keyspace-viem/decorators/keyspace";
import { getKeyspaceKey, serializePublicKeyFromPrivateKey } from "../../../utils/keyspace";
import { getKeyspaceConfigProof } from "../../../utils/keyspace";

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

// This verification key is not production-ready because it uses a locally
// generated KZG commitment instead of one with a trusted setup.
export const vkHashEcdsaAccount = "0xe513408e896618fd2b4877b44ecc81e6055647f6abb48e0356384fc63b2f72";

export function getDataHash(privateKey: Hex): Hex {
  const publicKey = serializePublicKeyFromPrivateKey(privateKey);
  const fullHash = keccak256(publicKey);
  const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);
  return toHex(truncatedHash);
}

export function getKeyspaceKeyForPrivateKey(privateKey: Hex): Hex {
  const dataHash = getDataHash(privateKey);
  return getKeyspaceKey(vkHashEcdsaAccount, dataHash);
}

export async function getAccount(privateKey: Hex): Promise<Address> {
  const keyspaceKey = getKeyspaceKeyForPrivateKey(privateKey);
  const owners = [{
    ksKeyType: 1,
    ksKey: fromHex(keyspaceKey, "bigint"),
  }];
  return await getAccountAddress(client as any, { owners, nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const dataHash = getDataHash(process.env.PRIVATE_KEY as Hex);
  const keyspaceKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const keyspaceProof = await getKeyspaceConfigProof(keyspaceKey, dataHash);

  const account = await getAccount(process.env.PRIVATE_KEY as Hex);
  const op = await buildUserOp(client, {
    account,
    signers: [{ ksKey: fromHex(keyspaceKey, "bigint"), ksKeyType: 1 }],
    calls,
    paymasterAndData: paymasterData,
    passkeySigner: false,
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });
  op.signature = await signAndWrapEOA({
    hash,
    privateKey: process.env.PRIVATE_KEY as Hex,
    keyspaceKey,
    stateProof: keyspaceProof.proof,
  });

  const opHash = await bundlerClient.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}
