require("dotenv").config();

import { encodeAbiParameters, Hex, parseEther } from "viem";

import { magicSpendAddress } from "../../generated";
import { withdrawSignature } from "../../utils/magicSpend";
import { client, getAccount, makeCalls } from "../base";

const asset = "0x0000000000000000000000000000000000000000";
const amount = parseEther("0.001");
const account = await getAccount();
const nonce = BigInt(Math.floor(Math.random() * 10000));
const expiry = Math.floor(Date.now() / 1000) + 1000;
const chainId = client.chain!.id;

async function main() {
  const data = encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "signature", type: "bytes" },
          { name: "asset", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint48" },
        ],
      },
    ],
    [
      {
        signature: await withdrawSignature({ account, asset, amount, nonce, expiry, chainId }),
        asset,
        amount,
        nonce,
        expiry,
      },
    ],
  );

  makeCalls([], `${magicSpendAddress}${data.slice(2)}` as Hex);
}

main();
