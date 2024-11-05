import { type Hex, encodeAbiParameters, keccak256 } from "viem";


export function getStorage(ownerBytes: Hex): Hex {
  return encodeAbiParameters([{
    components: [
      { name: "signers", type: "bytes[]" },
      { name: "sidecar", type: "bytes" },
    ],
    type: "tuple",
  }], [{
    signers: [ownerBytes],
    sidecar: "0x"
  }]);
}

export function getStorageHash(ownerBytes: Hex): Hex {
  return keccak256(getStorage(ownerBytes));
}
