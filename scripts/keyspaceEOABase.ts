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
import { poseidon } from "@noble/curves/abstract/poseidon";

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

// Keyspace key for the EcsdaAccount circuit using the ECDSA key with Ethereum address 0x7C55AC8898a8D9B73d366204A3CF44381b661923
export const keyspaceKey = "0x1563cace6b39ac44a995db247723ea7f9af0b03189710082fca90187bb4e33e1";
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

export function getKeyspaceKey(dataHash: Hex): Hex {
  // TODO: We need to configure a Poseidon hasher identically to the BN254
  // hasher in mdehoog/poseidon.
  // https://github.com/mdehoog/poseidon/blob/main/constants/bn254.go
  return keyspaceKey;
}

export async function getAccount(): Promise<Address> {
  return await getAccountAddress(client as any, { owners: [abiEncodedEOA], nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount();
  const dataHash = getDataHash(process.env.PRIVATE_KEY as Hex);
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
