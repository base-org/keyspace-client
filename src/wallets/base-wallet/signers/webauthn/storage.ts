import { Hex, toHex, Address } from "viem";
import { getInitialValueHash } from "../../../../value-hash";
import { serializePublicKeyFromPoint } from "./keys";
import { getStorageHash } from "../../storage";


export function getStorageHashForPrivateKey(privateKey: any): Hex {
  const pk256 = serializePublicKeyFromPoint(privateKey.x, privateKey.y);
  return getStorageHash(toHex(pk256));
}

export function getKeyspaceKeyForPrivateKey(privateKey: any, controller: Address): Hex {
  const storageHash = getStorageHashForPrivateKey(privateKey);
  return getInitialValueHash(controller, storageHash);
}
