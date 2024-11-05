import { type Hex, Address } from "viem";
import { getInitialValueHash } from "../../../../value-hash";
import { serializePublicKeyFromPrivateKey } from "./keys";
import { getStorageHash } from "../../storage";


export function getStorageHashForPrivateKey(privateKey: Hex): Hex {
  const ownerBytes = serializePublicKeyFromPrivateKey(privateKey);
  return getStorageHash(ownerBytes);
}

export function getKeystoreIDForPrivateKey(privateKey: Hex, controller: Address): Hex {
  const storageHash = getStorageHashForPrivateKey(privateKey);
  return getInitialValueHash(controller, storageHash);
}
