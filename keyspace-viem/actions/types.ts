import { Hash, Hex, RpcSchema } from "viem";

export type GetConfigProofParameters = {
  key: Hex;
  vkHash: Hash;
  dataHash: Hash;
};

export type GetRecoverProofParameters = {
  key: Hex;
  newKey254: Hex;
  circuitType: "secp256k1" | "webauthn";
  signature: Hex;
};

export type SetConfigParameters = {
  key: Hex;
  newKey: Hex;
  currentVk: Hex;
  currentData: Hex;
  proof: Hex;
}

export type GetConfigProofReturnType = {
  root: Hex;
  proof: Hex;
};

export type GetRecoverProofReturnType = {
  proof: Hex;
  currentVk: Hex;
  currentData: Hex;
};

export type MKSRRpcSchema = RpcSchema & [{
  Method: "mksr_proof";
  Parameters: [Hex, Hash, Hash];
  ReturnType: GetConfigProofReturnType;
}, {
  Method: "mksr_recover";
  Parameters: [Hex, Hex, string, Hex];
  ReturnType: GetRecoverProofReturnType;
}, {
  Method: "mksr_set";
  Parameters: [Hex, Hex, Hex, Hex, Hex];
  ReturnType: null;
}];
