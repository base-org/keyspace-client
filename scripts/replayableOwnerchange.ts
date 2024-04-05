import { bundlerActions, BundlerClient, UserOperation } from "permissionless";
import {
  Address,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  hexToBigInt,
  http,
  PublicClient,
} from "viem";
import { baseSepolia, sepolia } from "viem/chains";
const ECDSA = require("ecdsa-secp256r1");

import { privateKeyToAccount } from "viem/accounts";
import { writeContract } from "viem/actions";
import { accountAbi, entryPointAbi, entryPointAddress } from "../generated";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../index";
import { buildReplayableUserOp, getUserOpHashWithoutChainId } from "../utils/replayable";
import { buildWebAuthnSignature, p256WebAuthnSign } from "../utils/signature";
import { authenticatorData, getAccount, p256PrivateKey, p256PubKey } from "./base";

const chain = baseSepolia;
const altChain = sepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

export const altClient: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.ALT_RPC_URL || "",
  ),
}).extend(bundlerActions);

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
    data,
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

  const eoa = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  const x = await writeContract(altClient, {
    address: entryPointAddress,
    abi: entryPointAbi,
    functionName: "handleOps",
    args: [[op], op.sender],
    account: eoa,
    chain: altChain,
  });
  console.log("tx hash", x);
}

main();
