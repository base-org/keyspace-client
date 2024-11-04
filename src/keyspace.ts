import { secp256k1 } from "@noble/curves/secp256k1";
import { poseidonPerm } from "@zk-kit/poseidon-cipher";
import {
  Address,
  Chain,
  PublicClient,
  encodeAbiParameters,
  encodePacked,
  fromHex,
  keccak256,
  toHex,
  toRlp,
  type Hex,
} from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { p256WebAuthnSign } from "../src/sign";
import { encodePackedSignature, getStorageHashForPrivateKey as getDataHashSecp256k1 } from "./encode-signatures/secp256k1";
import { encodeWebAuthnAuth, getStorageHashForPrivateKey as getDataHashWebAuthn } from "./encode-signatures/webauthn";
import { GetConfigProofReturnType, KeyspaceClient, RecoveryServiceClient } from "./keyspace-viem/actions/types";
import { readContract } from "viem/actions";
import { anchorStateRegistryAbi, anchorStateRegistryAddress, bridgedKeystoreAbi, bridgedKeystoreAddress, keystoreAddress, l1BlockAbi, l1BlockAddress } from "../generated";
import { DebugClient } from "../scripts/lib/client";
import { baseSepolia, getGame } from "viem/op-stack";
import { sepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");


export function getKeystoreID(controller: Address, storageHash: Hex): Hex {
  const preimage = encodePacked(
    ["address", "uint96", "uint256"],
    [controller, BigInt(0), fromHex(storageHash, "bigint")]
  );
  return keccak256(preimage);
}

export function serializePublicKeyFromPoint(x: Uint8Array, y: Uint8Array): Uint8Array {
  const keyspaceData = new Uint8Array(256);
  keyspaceData.set(x, 0);
  keyspaceData.set(y, 32);
  return keyspaceData;
}

export function getPublicKeyPoint(publicKey: Uint8Array): { x: Uint8Array; y: Uint8Array } {
  const encodingByte = publicKey.slice(0, 1);
  if (encodingByte[0] !== 4) {
    throw new Error("Invalid public key encoding");
  }

  return {
    x: publicKey.slice(1, 33),
    y: publicKey.slice(33, 65),
  };
}

/**
 * Pack a public key into the 32 byte ownerBytes data record expected by 
 * CoinbaseSmartWallet.
 */
export function serializePublicKeyFromBytes(publicKey: Uint8Array): Hex {
  const keyHash = keccak256(publicKey);
  const address = `0x${keyHash.slice(2, 42)}` as Hex;
  return encodeAbiParameters([{ type: "address" }], [address]);
}

export function serializePublicKeyFromPrivateKey(privateKey: Hex): Hex {
  const account = privateKeyToAccount(privateKey);
  return encodeAbiParameters([{ type: "address" }], [account.address]);
}

export async function getConfirmedValueHashStorageProof(l1Client: PublicClient, masterClient: PublicClient, replicaClient: PublicClient, keystoreID: Hex) {
  // On the replica, get the L1 block number for the latest storage root.
  const l1BlockNumber = await readContract(replicaClient, {
    abi: bridgedKeystoreAbi,
    address: bridgedKeystoreAddress,
    functionName: "l1BlockNumber",
  });

  // On L1, get the master chain's confirmed block number at the given L1 block number.
  const [_, masterBlockNumber] = await readContract(l1Client, {
    abi: anchorStateRegistryAbi,
    address: anchorStateRegistryAddress,
    functionName: "anchors",
    args: [0],
    blockNumber: l1BlockNumber,
  });

  // On the master chain, get the storage proof for the keystoreID at the confirmed block number.
  const recordsSlotHash = keccak256(encodeAbiParameters([{ type: "uint256" }], [0n]));
  const valueHashSlotHash = keccak256(encodeAbiParameters([
    { type: "bytes32" }, { type: "bytes32" }],
    [keystoreID, recordsSlotHash])
  );
  const proof = await masterClient.getProof({
    address: keystoreAddress,
    storageKeys: [valueHashSlotHash],
    blockNumber: masterBlockNumber,
  });
  return proof.storageProof[0].proof;
}

/*
/// @dev A proof from which a Keystore storage root can be extracted.
struct KeystoreStorageRootProof {
    /// @dev The L1 block header, RLP-encoded.
    bytes l1BlockHeaderRlp;
    /// @dev The L1 block hash proof.
    L1BlockHashProof l1BlockHashProof;
    /// @dev The `AnchorStateRegistry` account proof on L1.
    bytes[] anchorStateRegistryAccountProof;
    /// @dev The storage proof of the reference L2 OutputRoot stored in the `AnchorStateRegistry` contract on L1.
    bytes[] anchorStateRegistryStorageProof;
    /// @dev The Keystore account proof on the reference L2.
    bytes[] keystoreAccountProof;
    /// @dev The state root of the reference L2.
    bytes32 l2StateRoot;
    /// @dev The storage root of the `MessagePasser` contract on the reference L2.
    bytes32 l2MessagePasserStorageRoot;
    /// @dev The block hash of the reference L2.
    bytes32 l2BlockHash;
}

/// @dev An L1 block hash proof specific to OPStack L2 chains.
struct OPStackProofData {
    /// @dev The L2 block header RLP encoded.
    bytes l2BlockHeaderRlp;
    /// @dev The L1Block oracle account proof on the L2.
    bytes[] l1BlockAccountProof;
    /// @dev The L1Block oracle hash slot storage proof on the L2.
    bytes[] l1BlockStorageProof;
}
*/
export async function getKeystoreStorageRootProof(l1Client: DebugClient, masterClient: PublicClient, replicaClient: DebugClient) {
  // Prove the latest L1Block value on the replica.
  const replicaBlockNumber = await replicaClient.getBlockNumber();
  const opStackL1BlockProof = await getOPStackL1BlockProof(replicaClient, replicaBlockNumber);
  const l1BlockHashProof = encodeOPStackL1BlockProof(opStackL1BlockProof);

  // Get the header of the latest L1 block on the replica.
  const l1BlockNumber = await readContract(replicaClient, {
    abi: l1BlockAbi,
    address: l1BlockAddress,
    functionName: "number",
    blockNumber: replicaBlockNumber,
  });
  const l1BlockHeaderRlp = await getBlockHeaderRlp(l1Client, l1BlockNumber);

  const anchorStorageProof = await getAnchorStateRegistryProof(l1Client, l1BlockNumber);
  const anchorStateRegistryAccountProof = anchorStorageProof.accountProof;
  const anchorStateRegistryStorageProof = anchorStorageProof.storageProof[0].proof;

  // On L1, get the master chain's confirmed block number at the given L1 block number.
  const [_, masterBlockNumber] = await readContract(l1Client, {
    abi: anchorStateRegistryAbi,
    address: anchorStateRegistryAddress,
    functionName: "anchors",
    args: [0],
    blockNumber: l1BlockNumber,
  });

  // Prove the keystore account on the master chain.
  const keystoreProof = await masterClient.getProof({
    address: keystoreAddress,
    storageKeys: [],
    blockNumber: masterBlockNumber,
  });
  const keystoreAccountProof = keystoreProof.accountProof;

  const outputRootPreimage = await getOutputRootPreimage(masterClient, masterBlockNumber);

  return {
    l1BlockHeaderRlp,
    l1BlockHashProof,
    anchorStateRegistryAccountProof,
    anchorStateRegistryStorageProof,
    keystoreAccountProof,
    l2StateRoot: outputRootPreimage.stateRoot,
    l2MessagePasserStorageRoot: outputRootPreimage.messagePasserStorageRoot,
    l2BlockHash: outputRootPreimage.hash,
  };
}

type OPStackProofData = {
  l2BlockHeaderRlp: Hex;
  l1BlockAccountProof: Hex[];
  l1BlockStorageProof: Hex[];
};

async function getOPStackL1BlockProof(client: DebugClient, blockNumber: bigint): OPStackProofData {
  const l2BlockHeaderRlp = await getBlockHeaderRlp(client, blockNumber);
  // cast storage 0x4200000000000000000000000000000000000015 --rpc-url https://sepolia.base.org
  const l1BlockHashSlot = BigInt(2);
  const l1BlockProof = await client.getProof({
    address: l1BlockAddress,
    storageKeys: [toHex(l1BlockHashSlot, { size: 32 })],
    blockNumber: blockNumber,
  });
  const l1BlockAccountProof = l1BlockProof.accountProof;
  const l1BlockStorageProof = l1BlockProof.storageProof[0].proof;

  return {
    l2BlockHeaderRlp,
    l1BlockAccountProof,
    l1BlockStorageProof,
  };
}

type L1BlockHashProof = {
  proofType: 1;
  proofData: Hex;
};

function encodeOPStackL1BlockProof(l1BlockProof: OPStackProofData): L1BlockHashProof {
  return {
    proofType: 1,
    proofData: encodeAbiParameters(
      [{
        components: [
          {
            name: "l2BlockHeaderRlp",
            type: "bytes",
          },
          {
            name: "l1BlockAccountProof",
            type: "bytes[]",
          },
          {
            name: "l1BlockStorageProof",
            type: "bytes[]",
          }
        ],
        type: "tuple",
      }],
      [l1BlockProof]
    ),
  }
}

/**
 * Reconstructs the block header in RLP (Recursive Length Prefix) encoding for a given block number.
 * 
 * Assumes the block header format for Cancun/Deneb blocks.
 * WARNING: This will break when the next hard fork adds new fields to the header.
 * 
 * @param client - An instance of `PublicClient` used to fetch the block data.
 * @param blockNumber - The block number for which the header is to be retrieved.
 * @returns A promise that resolves to the RLP encoded block header.
 * 
 * @throws Will throw an error if the block header hash does not match the expected hash.
 */
async function getBlockHeaderRlp(client: PublicClient, blockNumber: bigint) {
  const blockHeader = await client.getBlock({ blockNumber });
  const fields: Hex[] = [
    blockHeader.parentHash,
    blockHeader.sha3Uncles,
    blockHeader.miner,
    blockHeader.stateRoot,
    blockHeader.transactionsRoot,
    blockHeader.receiptsRoot,
    blockHeader.logsBloom,
    toHex(blockHeader.difficulty),
    toHex(blockHeader.number),
    toHex(blockHeader.gasLimit),
    toHex(blockHeader.gasUsed),
    toHex(blockHeader.timestamp),
    blockHeader.extraData,
    blockHeader.mixHash,
    blockHeader.nonce,
    toHex(blockHeader.baseFeePerGas || 0),
    blockHeader.withdrawalsRoot || "0x",
    toHex(blockHeader.blobGasUsed),
    toHex(blockHeader.excessBlobGas),
    blockHeader.parentBeaconBlockRoot || "0x",
  ].map((field) => /^0x0$/.test(field) ? "0x" : field);
  const rawHeader = toRlp(fields);
  const hash = keccak256(rawHeader);
  console.assert(hash === blockHeader.hash, "Block header hash mismatch");
  return rawHeader;
}

async function getAnchorStateRegistryProof(l1Client: PublicClient, l1BlockNumber: bigint) {
  // Prove the master chain output root at the given L1 block number.
  // cast storage 0x95907b5069e5a2ef1029093599337a6c9dac8923 --rpc-url https://rpc.sepolia.org
  const anchorsSlot = BigInt(1);
  return await l1Client.getProof({
    address: anchorStateRegistryAddress,
    storageKeys: [keccak256(encodeAbiParameters([
      { type: "uint256" },
      { type: "uint256" },
    ], [
      BigInt(0),
      anchorsSlot,
    ]))],
    blockNumber: l1BlockNumber,
  });
}

async function getOutputRootPreimage(client: PublicClient, blockNumber: bigint) {
  const messagePasserAddress = "0x4200000000000000000000000000000000000016";
  const messagePasserProof = await client.getProof({
    address: messagePasserAddress,
    storageKeys: [],
    blockNumber,
  });
  const masterBlock = await client.getBlock({ blockNumber });

  return {
    stateRoot: masterBlock.stateRoot,
    hash: masterBlock.hash,
    messagePasserStorageRoot: messagePasserProof.storageHash,
  }
}

export async function getAccount(client: PublicClient, ksKey: Hex, nonce: bigint, signatureType: "secp256k1" | "webauthn"): Promise<Address> {
}

export async function changeOwnerSecp256k1({
  keyspaceKey,
  currentPrivateKey,
  newPrivateKey,
  vkHash,
  keyspaceClient,
  recoveryClient,
}: {
  keyspaceKey: Hex;
  currentPrivateKey: Hex;
  newPrivateKey: Hex;
  vkHash: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const dataHash = getDataHashSecp256k1(newPrivateKey);
  const newKey = getKeystoreID(vkHash, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
  const signature = await sign({ hash: newKey254, privateKey: currentPrivateKey });
  const signatureData = encodePackedSignature(signature);
  performSetConfig({
    key: keyspaceKey,
    newKey,
    circuitType: "secp256k1",
    signatureData,
    keyspaceClient,
    recoveryClient,
  });
}

export async function changeOwnerWebAuthn({
  keyspaceKey,
  currentPrivateKey,
  newPrivateKey,
  vkHash,
  authenticatorData,
  keyspaceClient,
  recoveryClient,
}: {
  keyspaceKey: Hex;
  currentPrivateKey: any;
  newPrivateKey: any;
  vkHash: Hex;
  authenticatorData: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const dataHash = getDataHashWebAuthn(newPrivateKey);
  const newKey = getKeystoreID(vkHash, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });
  const { r, s, clientDataJSON } = p256WebAuthnSign({
    challenge: newKey254,
    p256PrivateKey: currentPrivateKey,
    authenticatorData,
  });

  // Changing owners requires the current public key, which cannot be recovered
  // from the signature without its v value. Instead, the signature data is
  // packed as (bytes32,bytes32,bytes) to include the public key for
  // this operation. The final bytes argument contains an ABI-encoded
  // WebAuthnAuth.
  const webAuthnAuthEncoded = encodeWebAuthnAuth({
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });
  const signatureData = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes" }],
    [toHex(currentPrivateKey.x), toHex(currentPrivateKey.y), webAuthnAuthEncoded]
  );
  performSetConfig({
    key: keyspaceKey,
    newKey,
    circuitType: "webauthn",
    signatureData,
    keyspaceClient,
    recoveryClient,
  });
}

async function performSetConfig({
  key,
  newKey,
  circuitType,
  signatureData,
  keyspaceClient,
  recoveryClient,
}: {
  key: Hex;
  newKey: Hex;
  circuitType: "secp256k1" | "webauthn";
  signatureData: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const recoverResult = await recoveryClient.getSignatureProof({
    key,
    newKey,
    circuitType,
    signature: signatureData,
  });

  console.log("recovery_signatureProof succeeded", recoverResult);
  const fullHash = keccak256(recoverResult.currentVk, "bytes");
  const truncatedHash = fullHash.slice(0, 31);
  const vkHash = toHex(truncatedHash);
  console.log("vkHash", vkHash);

  await keyspaceClient.setConfig({
    key,
    newKey,
    ...recoverResult,
  });
}

