import { Hex, encodePacked, fromHex, toHex } from "viem";
import { getDataHash, vkHashEcdsaAccount, keyspaceClient } from "./secp256k1/base";
import { getKeyspaceKey } from "../../utils/keyspace";
import { sign } from "viem/accounts";
import { vkHashWebAuthnAccount } from "../keyspaceWebAuthnBase";


export async function changeOwner(keyspaceKey: Hex, newPrivateKey: Hex, circuitType: "secp256k1" | "webauthn") {
  let vkHash = vkHashEcdsaAccount;
  let signFunc = sign;
  if (circuitType === "webauthn") {
    vkHash = vkHashWebAuthnAccount;
    signFunc = 
  }
  const dataHash = getDataHash(newPrivateKey);
  const newKey = getKeyspaceKey(vkHashEcdsaAccount, dataHash);
  const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2));
  const signature = await sign({ hash: newKey254, privateKey: newPrivateKey });
  const signatureData = encodePacked(
    ["bytes32", "bytes32", "uint8"],
    [
      signature.r,
      signature.s,
      parseInt(signature.v.toString()),
    ],
  );

  const recoverResult = await keyspaceClient.getRecoverProof({
    key: keyspaceKey,
    newKey254,
    circuitType: "secp256k1",
    signature: signatureData,
  });

  await keyspaceClient.setConfig({
    key: keyspaceKey,
    newKey,
    ...recoverResult,
  });
}
