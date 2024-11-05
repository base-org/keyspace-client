import { base64urlnopad } from "@scure/base";
import { Hex, encodeAbiParameters, hexToBigInt, stringToHex } from "viem";
import { encodeSignature, wrapSignature } from "../../user-op";
import { serializePublicKeyFromPoint } from "./storage";


export const dummyConfigProof = "0x21287fc0df33d607e167eb3b05673f922d00861d56f2065f81bdb5524fef9f1f145fa1adc9aea3631d29e854e082091dffab75e0835b893ccbb3e94659fb0547123660eaeeadb39c261d66c97e5f1aaf210572272fcb4203d67c7dd672b10f8a23654c9bd7610fa8fe2825f71df700f6f666fbd2826959ef0ea1d1ee73a6ace917ccadca5c6e16af62aa8980284ff753e6a20aa0ade9430109bdaf988b87698b27c7ae933914833abdb29bce8b16a54f7a9796533959a603fa5bcf3ce903953c07f5df552901136b9e9e3229529a54fc569b219e8e5bdd18dcdaaf84f4d0a72624629eab376526fd55276723b6849ecaa5fada155f4652e2b2ee18d50a010bd025f81034bec792c244d5a62dba2c8fb91b8e03491b013583fcd2ee67d59dc4e10c5574cfa7e73d0b770abe74b1c3490e3607b3ab94b54a8bfdcb664411f2541516bf30584c4a11a4da83bb3e22f80299ad91a6f770694b18b008667754919c050c63e8dd6bfc91eedb0acec20e43439c2d060f208ef54044cd069eed1c66e24210519eb726ef06b7b214949422938cc5108c910c856a8bb1eec9853f3e87cff8141c3c673ede8b2ce7fa96b8c6321f064e87400592a874c2100feaea3cfd17f81ce4e13a3adac1eccefc645e411fd88d72ed77db3a67a38339c6c0b8a6aa7f9218996c1c44dcf7a76765e44982ce57baf3eb0dc544e0e59dc15a031318a8df8f30222fb2092354de26ed0f308f10a8a36767aad93f0c3c80c39d5df754fee44a0e1dbf981877f3cb59ae1145df44b851540b2950c768544f7bcb56c2c8f73bc11c951cf0142073d783cc67b09ebb75035b653113b5313a4c782fc56470a5329221845243fa8b8a3860cb684fab630ac2cefdb5e4fcfdcb0e77f6ef88673492c31c7a11d7342dbc4c249e2b1634f9ff201dec7342de4de6fd737bde8d04bafe20236b920db78451b43a503e4f6134a7c08ee33adf3ac721e53c35dbe8c207755121210019ed44b0beb05183f70fbc40c9846fbc821f6a46556bd3f93828617b20216e2ed438f3f24f2744c82f1ce1a3179fb75f7f226dca6351bbe7aa180aedc32548bbb8df995d1977564b67cb5377fca9458978c395e9bbc7a84662036127cc25d093de9c689b7f9a7f803e8354227c4e6a0a76444a42eb178b993825bb633c";

export interface WebAuthnSignature {
  r: bigint;
  s: bigint;
  clientDataJSON: string;
  authenticatorData: string;
}

export const WebAuthnAuthStruct = {
  components: [
    {
      name: "authenticatorData",
      type: "bytes",
    },
    { name: "clientDataJSON", type: "bytes" },
    { name: "challengeIndex", type: "uint256" },
    { name: "typeIndex", type: "uint256" },
    {
      name: "r",
      type: "uint256",
    },
    {
      name: "s",
      type: "uint256",
    },
  ],
  name: "WebAuthnAuth",
  type: "tuple",
};

/**
 * Builds a dummy signature for estimating the gas cost of user operations.
 *
 * @returns {Uint8Array} The encoded dummy signature.
 */
export function buildDummySignature(): Hex {
  const challenge = new Uint8Array(32);
  return encodeSignature({
    signatureWrapper: wrapSignature(0n, encodeWebAuthnAuth({
      r: 0n,
      s: 0n,
      clientDataJSON: `{"type":"webauthn.get","challenge":"${base64urlnopad.encode(challenge)}","origin":"https://keys.coinbase.com"}`,
      authenticatorData: "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
    })),
    ownerBytes: serializePublicKeyFromPoint(new Uint8Array(32), new Uint8Array(32)),
    confirmedValueHashStorageProof: [],
  });
}

/**
 * Encodes a WebAuthn signature into the WebAuthnAuth struct expected by the Base Wallet contracts.
 *
 * @param signature - The signature to encode.
 * @returns The encoded signature.
 */
export function encodeWebAuthnAuth(
  { authenticatorData, clientDataJSON, r, s }: WebAuthnSignature
) {
  const challengeIndex = clientDataJSON.indexOf("\"challenge\":");
  const typeIndex = clientDataJSON.indexOf("\"type\":");

  return encodeAbiParameters(
    [WebAuthnAuthStruct],
    [
      {
        authenticatorData,
        clientDataJSON: stringToHex(clientDataJSON),
        challengeIndex,
        typeIndex,
        r,
        s,
      },
    ]
  );
}
