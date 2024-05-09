import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, fromHex, Hex, http, keccak256, toHex } from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../generated";
import { buildReplayableUserOp, getUserOpHashWithoutChainId } from "../utils/replayable";
import { buildSignatureWrapperForEOA } from "../utils/signature";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../utils/smartWallet";
import { keyspaceActions } from "../keyspace-viem/decorators/keyspace";
import { GetProofReturnType } from "../keyspace-viem/actions/getKeyspaceProof";
import { getKeyspaceKey, serializePublicKeyFromPrivateKey } from "../utils/keyspace";

const chain = baseSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

export const keyspaceClient = createPublicClient({
  chain,
  transport: http(
    process.env.KEYSPACE_RPC_URL || "https://sepolia-alpha.key.space",
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
  // TODO: Update owners to refer to a keyspace key.
  return await getAccountAddress(client as any, { owners: [abiEncodedEOA], nonce: 0n });
}

export async function getKeyspaceStateProof(): Promise<GetProofReturnType> {
  const dataHash = getDataHash(process.env.PRIVATE_KEY as Hex);
  const keyspaceKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const keyspaceProof = await keyspaceClient.getKeyspaceProof({
    key: keyspaceKey,
    vkHash: vkHashEcdsaAccount,
    dataHash,
  });
  console.log(keyspaceProof);
  return keyspaceProof;
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const keyspaceProof = await getKeyspaceStateProof();
  // TODO: Include the keyspace proof in the user operation once the contracts
  // support it.

  const account = await getAccount();
  // TODO: Update signers to refer to a keyspace key.
  const op = await buildUserOp(client, {
    account,
    signers: [abiEncodedEOA],
    calls,
    paymasterAndData: paymasterData,
    passkeySigner: false,
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });

  const signature = await sign({ hash, privateKey: process.env.PRIVATE_KEY as Hex });

  const signatureWrapper = buildSignatureWrapperForEOA({
    signature,
    ownerIndex: 0n,
  });
  op.signature = signatureWrapper;

  const opHash = await client.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}

export async function makeReplayableCalls(calls: Hex[], paymasterData = "0x" as Hex) {
  const account = await getAccount();

  const op = await buildReplayableUserOp(client, {
    account,
    signers: [encodeAbiParameters([{ type: "address" }], [eoa.address])],
    calls,
    passkeySigner: false,
  });

  const hash = getUserOpHashWithoutChainId({ userOperation: op });

  const signature = await sign({ hash, privateKey: process.env.PRIVATE_KEY as Hex });

  const signatureWrapper = buildSignatureWrapperForEOA({
    signature,
    ownerIndex: 0n,
  });
  op.signature = signatureWrapper;

  const opHash = await client.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);
}
