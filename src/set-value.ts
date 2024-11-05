import { type Hex, toHex, fromHex, encodeAbiParameters, keccak256 } from "viem";
import { sign } from "viem/accounts";
import { encodePackedSignature } from "./wallets/base-wallet/signers/secp256k1/signatures";
import { encodeWebAuthnAuth } from "./wallets/base-wallet/signers/webauthn/signatures";
import { getInitialValueHash } from "./value-hash";
import { KeyspaceClient, RecoveryServiceClient } from "./keyspace-viem/actions/types";
import { p256WebAuthnSign } from "./wallets/base-wallet/signers/webauthn/sign";


export async function changeOwnerSecp256k1({
  keyspaceKey, currentPrivateKey, newPrivateKey, vkHash, keyspaceClient, recoveryClient,
}: {
  keyspaceKey: Hex;
  currentPrivateKey: Hex;
  newPrivateKey: Hex;
  vkHash: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const dataHash = "0xFIXME";
  const newKey = getInitialValueHash(vkHash, dataHash);
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
  keyspaceKey, currentPrivateKey, newPrivateKey, vkHash, authenticatorData, keyspaceClient, recoveryClient,
}: {
  keyspaceKey: Hex;
  currentPrivateKey: any;
  newPrivateKey: any;
  vkHash: Hex;
  authenticatorData: Hex;
  keyspaceClient: KeyspaceClient;
  recoveryClient: RecoveryServiceClient;
}) {
  const dataHash = "0xFIXME";
  const newKey = getInitialValueHash(vkHash, dataHash);
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
  key, newKey, circuitType, signatureData, keyspaceClient, recoveryClient,
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
