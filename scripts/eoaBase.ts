import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, Hex, http } from "viem";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../generated";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../utils/smartWallet";
import { buildSignatureWrapperForEOA } from "../utils/signature";
import { privateKeyToAccount, sign } from "viem/accounts";

const chain = baseSepolia;

export const client: BundlerClient = createPublicClient({
  chain,
  transport: http(
    process.env.RPC_URL || "",
  ),
}).extend(bundlerActions);

const eoa = privateKeyToAccount(process.env.PRIVATE_KEY as Hex || "");

export async function getAccount(): Promise<Address> {
  return await getAccountAddress(client as any, { owners: [encodeAbiParameters([{type: 'address'}], [eoa.address])], nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount();

  const op = await buildUserOp(client, {
    account,
    signers: [encodeAbiParameters([{type: 'address'}], [eoa.address])],
    calls,
    paymasterAndData: paymasterData,
    passkeySigner: false,
  });

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });

  const signature = await sign({hash, privateKey: process.env.PRIVATE_KEY as Hex});

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

makeCalls([])