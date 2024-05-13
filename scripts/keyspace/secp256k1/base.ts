import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, fromHex, Hex, http, HttpTransportConfig, keccak256, toHex } from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../../../generated";
import { signAndWrapEOA } from "../../../utils/signature";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../../../utils/smartWallet";
import { keyspaceActions } from "../../../keyspace-viem/decorators/keyspace";
import { GetConfigProofReturnType } from "../../../keyspace-viem/actions/types";
import { getKeyspaceKey, serializePublicKeyFromPrivateKey } from "../../../utils/keyspace";

const chain = baseSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

const keyspaceClientConfig: HttpTransportConfig = {
  // By default, viem will retry failed requests 3 times. It considers timeouts
  // as failures and will retry them as well.
  retryCount: 0,
  timeout: 30_000,
};

export const keyspaceClient = createPublicClient({
  chain,
  transport: http(
    process.env.KEYSPACE_RPC_URL || "https://sepolia-alpha.key.space",
    keyspaceClientConfig,
  ),
}).extend(keyspaceActions());

export const eoa = privateKeyToAccount(process.env.PRIVATE_KEY as Hex || "");
export const abiEncodedEOA = encodeAbiParameters([{ type: "address" }], [eoa.address]);
// This verification key is not production-ready because it uses a locally
// generated KZG commitment instead of one with a trusted setup.
export const vkHashEcdsaAccount = "0x5F3AD85187D374A196B7F0091FDAE25710EC375C24D229618DBECA9FE16994";

export function getDataHash(privateKey: Hex): Hex {
  const publicKey = serializePublicKeyFromPrivateKey(privateKey);
  const fullHash = keccak256(publicKey);
  const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);
  return toHex(truncatedHash);
}

export async function getAccount(): Promise<Address> {
  const dataHash = getDataHash(process.env.PRIVATE_KEY as Hex);
  const keyspaceKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const owners = [{
    ksKeyType: 1,
    ksKey: fromHex(keyspaceKey, "bigint"),
  }];
  return await getAccountAddress(client as any, { owners, nonce: 0n });
}

export async function getKeyspaceConfigProof(keyspaceKey: Hex, dataHash: Hex): Promise<GetConfigProofReturnType> {
  const keyspaceProof = await keyspaceClient.getConfigProof({
    key: keyspaceKey,
    vkHash: vkHashEcdsaAccount,
    dataHash,
  });
  console.log(keyspaceProof);
  return keyspaceProof;
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const dataHash = getDataHash(process.env.PRIVATE_KEY as Hex);
  const keyspaceKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const keyspaceProof = await getKeyspaceConfigProof(keyspaceKey, dataHash);

  const account = await getAccount();
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

  const opHash = await client.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}
