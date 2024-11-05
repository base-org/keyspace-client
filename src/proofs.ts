import { PublicClient, type Hex, keccak256, encodeAbiParameters, toHex, toRlp } from "viem";
import { readContract } from "viem/actions";
import { bridgedKeystoreAbi, bridgedKeystoreAddress, anchorStateRegistryAbi, anchorStateRegistryAddress, keystoreAddress, l1BlockAbi, l1BlockAddress } from "../generated";
import { DebugClient } from "../scripts/lib/client";


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
    { type: "bytes32" }, { type: "bytes32" }
  ],
    [keystoreID, recordsSlotHash])
  );
  const proof = await masterClient.getProof({
    address: keystoreAddress,
    storageKeys: [valueHashSlotHash],
    blockNumber: masterBlockNumber,
  });
  return proof.storageProof[0].proof;
}

export async function getKeystoreStorageRootProof(l1Client: DebugClient, masterClient: PublicClient, replicaClient: DebugClient) {
  // Prove the latest L1Block value on the replica.
  const replicaBlockNumber = await replicaClient.getBlockNumber() - 1n;
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

async function getOPStackL1BlockProof(client: DebugClient, blockNumber: bigint): Promise<OPStackProofData> {
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
  };
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
  };
}
