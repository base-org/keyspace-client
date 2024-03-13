import { expect, test } from "bun:test";
import { createPublicClient, hashMessage, http, PublicClient } from "viem";
import { baseSepolia } from "viem/chains";
import { createAccountCalldata } from "..";
import { mockWebAuthnERC1271CompatibleEIP191Sign, replaySafeHash } from "./ERC1271";
const ECDSA = require("ecdsa-secp256r1");

export const client: PublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    process.env.RPC_URL || "",
  ),
});

// matches solidity test here // matches solidity test here https://github.com/coinbase/smart-wallet/blob/9b400ea59f9c95d34e5d6d5d7e4b826ebd821b1a/test/ERC1271.t.sol#L40
test("replaySafeHash produces expected output", async () => {
  const account = "0x2Af621c1B01466256393EBA6BF183Ac2962fd98C";
  const ownerPublicKey =
    "0x66efa90a7c6a9fe2f4472dc80307116577be940f06f4b81b3cce9207d0d35ebdd420af05337a40c253b6a37144c30ba22bbd54c71af9e4457774d790b34c8227";
  const factory = "0xAb784cC3cc0339013BD064C214e71D96Beb435d9";
  const factoryCalldata = createAccountCalldata({ owners: [ownerPublicKey], nonce: 0n });
  const r = await replaySafeHash(client as any, {
    hash: hashMessage("hey"),
    account,
    factory,
    factoryCalldata,
  });
  expect("0x1b03b7e3bddbb2f9b5080f154cf33fcbed9b9cd42c98409fb0730369426a0a69").toEqual(r);
});

test("mockWebAuthnERC1271CompatibleEIP191Sign passes verifyMessage", async () => {
  const account = "0x2Af621c1B01466256393EBA6BF183Ac2962fd98C";
  const message = "hey";
  const p256PrivateKey = ECDSA.fromJWK({
    "kty": "EC",
    "crv": "P-256",
    "x": "Zu-pCnxqn-L0Ry3IAwcRZXe-lA8G9LgbPM6SB9DTXr0",
    "y": "1CCvBTN6QMJTtqNxRMMLoiu9VMca-eRFd3TXkLNMgic",
    "d": "nzgOHqVKQRZ1k8q5qcD28GcUfZdDS6jbx8w4wQ4sChQ",
  });
  const ownerPublicKey =
    "0x66efa90a7c6a9fe2f4472dc80307116577be940f06f4b81b3cce9207d0d35ebdd420af05337a40c253b6a37144c30ba22bbd54c71af9e4457774d790b34c8227";
  const factory = "0xAb784cC3cc0339013BD064C214e71D96Beb435d9";
  const signature = await mockWebAuthnERC1271CompatibleEIP191Sign(client as any, {
    message,
    account: "0x2Af621c1B01466256393EBA6BF183Ac2962fd98C",
    p256PrivateKey,
    factory,
    owners: [ownerPublicKey],
  });
  expect(client.verifyMessage({ address: account, message, signature }));
});
