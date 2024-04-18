import { bundlerActions, BundlerClient, UserOperation } from "permissionless";
import {
  Address,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  hexToBigInt,
  http,
  parseEther,
  PublicClient,
} from "viem";
import { base, baseSepolia, optimismSepolia, sepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");

import { privateKeyToAccount } from "viem/accounts";
import { getBalance, getBytecode, writeContract } from "viem/actions";
import { accountAbi, accountFactoryAddress, entryPointAbi, entryPointAddress } from "../generated";
import { buildReplayableUserOp, getUserOpHashWithoutChainId } from "../utils/replayable";
import { buildWebAuthnSignature, p256WebAuthnSign } from "../utils/signature";
import { buildUserOp, Call, createAccountCalldata, getAccountAddress, getUserOpHash } from "../utils/smartWallet";
import { authenticatorData, getAccount, p256PrivateKey, p256PubKey } from "./base";

const chain = baseSepolia;
const replayChain = optimismSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

export const replayChainClient: PublicClient = createPublicClient({
  chain: replayChain,
  transport: http(
    process.env.REPLAY_CHAIN_RPC_URL || "",
  ),
});

type ReservoirTx = {
  data: Hex;
  to: Address;
  value: BigInt;
};

export async function main() {
  const account = await getAccount();

  const data = encodeFunctionData({
    abi: accountAbi,
    functionName: "addOwnerAddress",
    args: ["0xd096bCb1cb4a7c40aC49Ab05A213bEc3637E3f9f" as Address],
  });

  const op = await buildReplayableUserOp(client, {
    account,
    signers: [p256PubKey()],
    calls: [data],
  });

  op.verificationGasLimit = 800000n;

  const hash = getUserOpHashWithoutChainId({ userOperation: op });

  const { r, s, clientDataJSON } = p256WebAuthnSign({
    challenge: hash,
    authenticatorData,
    p256PrivateKey,
  });

  const signatureWrapper = buildWebAuthnSignature({
    ownerIndex: 0n,
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });
  op.signature = signatureWrapper;

  const opHash = await client.sendUserOperation({
    userOperation: op,
    entryPoint: entryPointAddress,
  });

  console.log("opHash", opHash);

  const block = await replayChainClient.getBlock();
  const priorityFee = block.baseFeePerGas + op.maxPriorityFeePerGas;
  const gasPrice = op.maxFeePerGas < priorityFee ? op.maxFeePerGas : priorityFee;
  const cost = (op.callGasLimit + op.verificationGasLimit + op.preVerificationGas) * gasPrice;
  const replayChainAccountBalance = await getBalance(replayChainClient, { address: op.sender });
  const diff = cost - replayChainAccountBalance;
  const ethNeededOnReplayChain = diff > 0 ? diff : 0n;
  const code = await getBytecode(replayChainClient, { address: op.sender });
  const needsDeploy = !code;

  const senderChainAccountBalance = await getBalance(client, { address: op.sender });
  const estimateReservoirOverhead = parseEther("0.0001");
  const neededOnSenderChain = cost + estimateReservoirOverhead;
  if (needsDeploy) {
    /// neededOnSenderChain += estimated cost of createAccount call on factory
    /// estimateReservoirOverhead += parseEther("0.0001")
  }

  if (senderChainAccountBalance < neededOnSenderChain) {
    /// alert need to fund sender chain
  }

  const senderChainCanFundReplayChain = senderChainAccountBalance > neededOnSenderChain + ethNeededOnReplayChain;

  const transactions: ReservoirTx[] = [];

  // NOTE: need a hard flag for chains that do not have ETH as native asset

  if (needsDeploy) {
    transactions.push({
      to: accountFactoryAddress,
      value: senderChainCanFundReplayChain ? ethNeededOnReplayChain : 0n,
      // be sure to pass original owners / nonce to get the same account address
      data: createAccountCalldata({ owners: [p256PubKey()], nonce: 0n }),
    });
  } else {
    // NOTE should also check that this second call here doesn't break the logic of senderChainCanFundReplayChain
    // build in padding to estimateReservoirOverhead
    if (senderChainCanFundReplayChain && ethNeededOnReplayChain > 0n) {
      transactions.push({
        to: op.sender,
        value: ethNeededOnReplayChain,
        data: "0x",
      });
    }
  }

  if (!senderChainCanFundReplayChain) {
    // alert user needs to fund replay chain out of band
  }

  transactions.push({
    to: entryPointAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: entryPointAbi,
      functionName: "handleOps",
      args: [[op], op.sender],
    }),
  });

  // send
}

// main();
