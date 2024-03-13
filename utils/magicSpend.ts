import { Address, encodeAbiParameters, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { magicSpendAddress } from "../generated";

/// NOTE to use this `process.env.PRIVATE_KEY` must match the MagicSpend owner
/// see deploy script https://github.com/coinbase/magic-spend/blob/main/script/DeployMagicSpend.s.sol
export const withdrawSignature = async (
  { account, chainId, asset, amount, nonce, expiry }: {
    account: Address;
    chainId: number;
    asset: Address;
    amount: bigint;
    nonce: bigint;
    expiry: number;
  },
) => {
  const data = encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "magicSpend", type: "address" },
          { name: "account", type: "address" },
          { name: "chainId", type: "uint256" },
          { name: "asset", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint48" },
        ],
      },
    ],
    [
      {
        magicSpend: magicSpendAddress,
        account,
        chainId: BigInt(chainId),
        asset,
        amount,
        nonce,
        expiry,
      },
    ],
  );

  const signer = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  const sig = await signer.signMessage({ message: { raw: data } });
  return sig;
};
