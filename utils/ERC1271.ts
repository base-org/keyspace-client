import {
  Address,
  concat,
  encodeAbiParameters,
  encodeDeployData,
  hashMessage,
  hashTypedData,
  Hex,
  parseAbiParameters,
  PublicClient,
  SignableMessage,
} from "viem";
import { signMessage } from "viem/accounts";
import { getBytecode } from "viem/actions";
import { createAccountCalldata } from "..";
import { accountFactoryAddress, erc1271InputGeneratorAbi } from "../generated";
import { authenticatorData, client } from "../scripts/base";
import { buildWebAuthnSignature, p256WebAuthnSign } from "./signature";

// ERC-6492 magic bytes
export const magicBytes = "0x6492649264926492649264926492649264926492649264926492649264926492";
const ERC1271InputGeneratorByteCode =
  "0x608060405234801561001057600080fd5b506040516103ab3803806103ab83398101604081905261002f91610274565b600061003d85858585610049565b90508060805260206080f35b60006001600160a01b0385163b156100cb5760405163670a835f60e11b8152600481018590526001600160a01b0386169063ce1506be90602401602060405180830381865afa1580156100a0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100c49190610351565b905061021a565b600080846001600160a01b0316846040516100e6919061036a565b6000604051808303816000865af19150503d8060008114610123576040519150601f19603f3d011682016040523d82523d6000602084013e610128565b606091505b50915091508161014a576040516294555560e51b815260040160405180910390fd5b6000818060200190518101906101609190610386565b9050876001600160a01b0316816001600160a01b0316146101ab5760405163c862438360e01b81526001600160a01b03808a1660048301528216602482015260440160405180910390fd5b60405163670a835f60e11b8152600481018890526001600160a01b0389169063ce1506be90602401602060405180830381865afa1580156101f0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102149190610351565b93505050505b949350505050565b6001600160a01b038116811461023757600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561026b578181015183820152602001610253565b50506000910152565b6000806000806080858703121561028a57600080fd5b845161029581610222565b6020860151604087015191955093506102ad81610222565b60608601519092506001600160401b03808211156102ca57600080fd5b818701915087601f8301126102de57600080fd5b8151818111156102f0576102f061023a565b604051601f8201601f19908116603f011681019083821181831017156103185761031861023a565b816040528281528a602084870101111561033157600080fd5b610342836020830160208801610250565b979a9699509497505050505050565b60006020828403121561036357600080fd5b5051919050565b6000825161037c818460208701610250565b9190910192915050565b60006020828403121561039857600080fd5b81516103a381610222565b939250505056fe";

/// factory and factoryCallData do not need to be passed if account is already deployed on the chain
export const mockWebAuthnERC1271CompatibleEIP191Sign = async (
  client: PublicClient,
  { account, message, p256PrivateKey, factory, owners }: {
    account: Address;
    message: SignableMessage;
    p256PrivateKey: any;
    factory?: Address;
    owners?: Hex[];
  },
) => {
  const hash = hashMessage(message);
  const factoryCalldata = owners && factory ? createAccountCalldata({ owners, nonce: 0n }) : "0x";
  const toSign = await replaySafeHash(client, { hash, account, factoryCalldata });

  const { r, s, clientDataJSON } = p256WebAuthnSign({
    challenge: toSign,
    authenticatorData,
    p256PrivateKey,
  });

  var signature = buildWebAuthnSignature({
    ownerIndex: 0n,
    authenticatorData,
    clientDataJSON,
    r,
    s,
  });

  const accountBytecode = await getBytecode(client, { address: account });
  if (!accountBytecode) {
    signature = concat([
      encodeAbiParameters(
        parseAbiParameters(
          "address accountFactory, bytes createAccountCalldata, bytes originalSignature",
        ),
        [accountFactoryAddress, factoryCalldata, signature],
      ),
      magicBytes,
    ]);
  }

  return signature;
};

/// NOTE Ethereum addresses in `owners` should be abi.encode to 32 bytes
/// factory and factoryCallData do not need to be passed if account is already deployed on the chain
export const replaySafeHash = async (
  client: PublicClient,
  { hash, account, factory, factoryCalldata }: {
    hash: Hex;
    account: Address;
    factory?: Address;
    factoryCalldata?: Hex;
  },
) => {
  const data = encodeDeployData({
    bytecode: ERC1271InputGeneratorByteCode,
    abi: erc1271InputGeneratorAbi,
    args: [account, hash, accountFactoryAddress, factoryCalldata || "0x"],
  });

  const { data: safeHash } = await client.call({ data });
  if (!safeHash) throw new Error("failed to fetch replay safe hash");

  return safeHash;
};
