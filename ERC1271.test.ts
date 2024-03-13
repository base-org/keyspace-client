import { expect, test } from "bun:test";
import {
  AbiParameter,
  Address,
  concat,
  encodeAbiParameters,
  getTypesForEIP712Domain,
  hashDomain,
  hashMessage,
  hashTypedData,
  HashTypedDataParameters,
  HashTypedDataReturnType,
  Hex,
  keccak256,
  SignableMessage,
  toHex,
  TypedData,
  validateTypedData,
} from "viem";
import { signTypedData } from "viem/accounts";
import { base } from "viem/chains";

const name = "Coinbase Smart Account";
const version = "1";
const types = {
  CoinbaseSmartAccountMessage: [{ name: "hash", type: "bytes32" }],
};

export function getPersonalSignHash(
  { message, chainId, account }: { message: SignableMessage; chainId: number; account: Address },
) {
  return replaySafeHash({ hash: hashMessage(message), chainId, account });
}

export function getSignTypedDataHash<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | "EIP712Domain",
>(
  { parameters, chainId, account }: {
    parameters: HashTypedDataParameters<typedData, primaryType>;
    chainId: number;
    account: Address;
  },
) {
  return replaySafeHash({ hash: hashTypedData(parameters), chainId, account });
}

type GetReplaySafeMessageHashParams = {
  hash: Hex;
  chainId: number;
  account: Address;
};

export function replaySafeHash({
  hash,
  chainId,
  account,
}: GetReplaySafeMessageHashParams) {
  return hashTypedData({
    domain: {
      name,
      version,
      chainId,
      verifyingContract: account,
    },
    types,
    primaryType: "CoinbaseSmartAccountMessage",
    message: {
      hash,
    },
  });
}

test("getReplaySafeMessageHash", () => {
  const expected = "Oxa0353ee2b480e8c198b4695f0ecaee9ac88031538a83f7520f40441e508e4336" as Hex;
  const r = replaySafeHash({
    hash: "0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68" as Hex, // OR hashTypedData for typedDataSignature
    chainId: base.id,
    account: "0xee054eaf083efc3c559b48ba80af286cbd22755d",
  });

  console.log("r", r);
});

function debug<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | "EIP712Domain",
>(
  parameters: HashTypedDataParameters<typedData, primaryType>,
) {
  const {
    domain = {},
    message,
    primaryType,
  } = parameters as HashTypedDataParameters;
  const types = {
    EIP712Domain: getTypesForEIP712Domain({ domain }),
    ...parameters.types,
  };
  console.log("types", types);
  console.log("message", message);

  // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  // as we can't statically check this with TypeScript.
  validateTypedData({
    domain,
    message,
    primaryType,
    types,
  });
  console.log(validateTypedData({
    domain,
    message,
    primaryType,
    types,
  }));
  console.log("domain", domain);

  const parts: Hex[] = ["0x1901"];
  if (domain) {
    parts.push(
      hashDomain({
        domain,
        types: types as any,
      }),
    );
  }

  if (primaryType !== "EIP712Domain") {
    parts.push(
      hashStruct({
        data: message,
        primaryType,
        types: types as any,
      }),
    );
  }

  console.log(parts);
  console.log("primaryType", primaryType);
  console.log("types", types);

  return keccak256(concat(parts));
}

function hashStruct({
  data,
  primaryType,
  types,
}: {
  data: Record<string, unknown>;
  primaryType: string;
  types: Record<string, MessageTypeProperty[]>;
}) {
  const encoded = encodeData({
    data,
    primaryType,
    types,
  });
  console.log("data", data);
  console.log("encoded", encoded);
  return keccak256(encoded);
}

function encodeData({
  data,
  primaryType,
  types,
}: {
  data: Record<string, unknown>;
  primaryType: string;
  types: Record<string, MessageTypeProperty[]>;
}) {
  const encodedTypes: AbiParameter[] = [{ type: "bytes32" }];
  const encodedValues: unknown[] = [hashType({ primaryType, types })];

  for (const field of types[primaryType]) {
    const [type, value] = encodeField({
      types,
      name: field.name,
      type: field.type,
      value: data[field.name],
    });
    encodedTypes.push(type);
    encodedValues.push(value);
  }

  return encodeAbiParameters(encodedTypes, encodedValues);
}

function hashType({
  primaryType,
  types,
}: {
  primaryType: string;
  types: Record<string, MessageTypeProperty[]>;
}) {
  const encodedHashType = toHex(encodeType({ primaryType, types }));
  return keccak256(encodedHashType);
}

function encodeType({
  primaryType,
  types,
}: {
  primaryType: string;
  types: Record<string, MessageTypeProperty[]>;
}) {
  let result = "";
  const unsortedDeps = findTypeDependencies({ primaryType, types });
  unsortedDeps.delete(primaryType);

  const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
  for (const type of deps) {
    result += `${type}(${
      types[type]
        .map(({ name, type: t }) => `${t} ${name}`)
        .join(",")
    })`;
  }

  return result;
}

type FindTypeDependenciesErrorType = "";

function findTypeDependencies(
  {
    primaryType: primaryType_,
    types,
  }: {
    primaryType: string;
    types: Record<string, MessageTypeProperty[]>;
  },
  results: Set<string> = new Set(),
): Set<string> {
  const match = primaryType_.match(/^\w*/u);
  const primaryType = match?.[0]!;
  if (results.has(primaryType) || types[primaryType] === undefined) {
    return results;
  }

  results.add(primaryType);

  for (const field of types[primaryType]) {
    findTypeDependencies({ primaryType: field.type, types }, results);
  }
  return results;
}

type EncodeFieldErrorType = "";

function encodeField({
  types,
  name,
  type,
  value,
}: {
  types: Record<string, MessageTypeProperty[]>;
  name: string;
  type: string;
  value: any;
}): [type: AbiParameter, value: any] {
  if (types[type] !== undefined) {
    return [
      { type: "bytes32" },
      keccak256(encodeData({ data: value, primaryType: type, types })),
    ];
  }

  if (type === "bytes") {
    const prepend = value.length % 2 ? "0" : "";
    value = `0x${prepend + value.slice(2)}`;
    return [{ type: "bytes32" }, keccak256(value)];
  }

  if (type === "string") return [{ type: "bytes32" }, keccak256(toHex(value))];

  if (type.lastIndexOf("]") === type.length - 1) {
    const parsedType = type.slice(0, type.lastIndexOf("["));
    const typeValuePairs = (value as [AbiParameter, any][]).map((item) =>
      encodeField({
        name,
        type: parsedType,
        types,
        value: item,
      })
    );
    return [
      { type: "bytes32" },
      keccak256(
        encodeAbiParameters(
          typeValuePairs.map(([t]) => t),
          typeValuePairs.map(([, v]) => v),
        ),
      ),
    ];
  }

  return [{ type }, value];
}

type MessageTypeProperty = {
  name: string;
  type: string;
};
