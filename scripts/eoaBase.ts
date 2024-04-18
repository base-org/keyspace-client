import { bundlerActions, BundlerClient } from "permissionless";
import { Address, createPublicClient, encodeAbiParameters, Hex, http } from "viem";
import { baseSepolia } from "viem/chains";
import { entryPointAddress } from "../generated";
import { buildUserOp, Call, getAccountAddress, getUserOpHash } from "../index";
import { buildWebAuthnSignature, p256WebAuthnSign } from "../utils/signature";
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
  return await getAccountAddress(client as any, { owners: [eoa.address], nonce: 0n });
}

export async function makeCalls(calls: Call[], paymasterData = "0x" as Hex) {
  const account = await getAccount();

  const op = await buildUserOp(client, {
    account,
    signers: [eoa.address],
    calls,
    paymasterAndData: paymasterData,
  });

  op.verificationGasLimit = 800000n;

  const hash = getUserOpHash({ userOperation: op, chainId: BigInt(chain.id) });

  const signature = await sign({hash, privateKey: process.env.PRIVATE_KEY as Hex});

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
}

