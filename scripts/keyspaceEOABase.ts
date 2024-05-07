import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, fromHex, Hex, http, keccak256, toHex } from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { secp256k1 } from '@noble/curves/secp256k1'
import { entryPointAddress } from "../generated";
import { buildReplayableUserOp, getUserOpHashWithoutChainId } from "../utils/replayable";
import { buildSignatureWrapperForEOA } from "../utils/signature";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../utils/smartWallet";
import { keyspaceActions } from "../keyspace-viem/decorators/keyspace";
import { poseidonPerm } from "@zk-kit/poseidon-cipher";

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
export const vkHashEcdsaAccount = "0x5F3AD85187D374A196B7F0091FDAE25710EC375C24D229618DBECA9FE16994";

/**
 * Pack an ECDSA public key into the 256 byte Keyspace data record expected by the EcsdaAccount circuit.
 */
export function serializePublicKey(privateKey: Hex): Uint8Array {
  const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false);
  const encodingByte = publicKey.slice(0, 1);
  if (encodingByte[0] !== 4) {
    throw new Error("Invalid public key encoding");
  }

  const publicKeyX = publicKey.slice(1, 33);
  const publicKeyY = publicKey.slice(33, 65);

  const keyspaceData = new Uint8Array(256);
  keyspaceData.set(publicKeyX, 0);
  keyspaceData.set(publicKeyY, 32);
  return keyspaceData;
}

export function getDataHash(privateKey: Hex): Hex {
  const publicKey = serializePublicKey(privateKey);
  const fullHash = keccak256(publicKey);
  const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);
  return toHex(truncatedHash);
}

/**
 * Generate the poseidon hash of the inputs provided
 * @param inputs The inputs to hash
 * @returns the hash of the inputs
 * From https://github.com/privacy-scaling-explorations/maci/blob/2fe5c57/crypto/ts/hashing.ts
 */
export const poseidon = (inputs: bigint[]): bigint => poseidonPerm([BigInt(0), ...inputs.map((x) => BigInt(x))])[0];

export function getKeyspaceKey(dataHash: Hex): Hex {
  // The poseidon hash function provided by viem's preferred @noble/curves
  // crypto library must be configured manually, and their example usage is not
  // clear.
  // https://github.com/paulmillr/scure-starknet/blob/3905471/index.ts#L329-L336
  // The configured hasher from @zk-kit/poseidon-cipher seems to match the
  // configuration for BN254 in mdehoog/poseidon.
  const hash = poseidon([fromHex(vkHashEcdsaAccount, "bigint"), fromHex(dataHash, "bigint")]);
  return toHex(hash);
}

export async function getAccount(): Promise<Address> {
  return await getAccountAddress(client as any, { owners: [abiEncodedEOA], nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount();
  const dataHash = getDataHash(process.env.PRIVATE_KEY as Hex);
  const keyspaceKey = getKeyspaceKey(dataHash);
  const keyspaceProof = await keyspaceClient.getKeyspaceProof({
    key: keyspaceKey,
    vkHash: vkHashEcdsaAccount,
    dataHash,
  });

  console.log(keyspaceProof);

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
