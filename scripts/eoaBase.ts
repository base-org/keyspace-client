import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, Hex, http } from "viem";
import { privateKeyToAccount, sign } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../generated";
import { buildReplayableUserOp, getUserOpHashWithoutChainId } from "../utils/replayable";
import { encodeSignatureWrapper } from "../utils/encodeSignatures/secp256k1";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../utils/smartWallet";

const chain = baseSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

export const eoa = privateKeyToAccount(process.env.PRIVATE_KEY as Hex || "");
export const abiEncodedEOA = encodeAbiParameters([{ type: "address" }], [eoa.address]);

export async function getAccount(): Promise<Address> {
  return await getAccountAddress(client as any, { owners: [abiEncodedEOA], nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount();

  const op = await buildUserOp(client, {
    account,
    signers: [abiEncodedEOA],
    calls,
    paymasterAndData: paymasterData,
    passkeySigner: false,
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });

  const signature = await sign({ hash, privateKey: process.env.PRIVATE_KEY as Hex });

  const signatureWrapper = encodeSignatureWrapper({
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

  const signatureWrapper = encodeSignatureWrapper({
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
