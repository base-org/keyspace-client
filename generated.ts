//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Account
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const accountAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'keystore_', internalType: 'address', type: 'address' },
      { name: 'aggregator_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'aggregator',
    outputs: [
      {
        name: '',
        internalType: 'contract CoinbaseSmartWalletAggregator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'functionSelector', internalType: 'bytes4', type: 'bytes4' },
    ],
    name: 'canSkipChainIdValidation',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'domainSeparator',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct CoinbaseSmartWallet.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'executeBatch',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'calls', internalType: 'bytes[]', type: 'bytes[]' }],
    name: 'executeWithoutChainIdValidation',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '$', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'ksID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'hash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: 'result', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'keystore',
    outputs: [
      { name: '', internalType: 'contract BridgedKeystore', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'keystoreID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'hash', internalType: 'bytes32', type: 'bytes32' }],
    name: 'replaySafeHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'missingAccountFunds', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validateUserOp',
    outputs: [
      { name: 'validationData', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  { type: 'error', inputs: [], name: 'Initialized' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'bytes', type: 'bytes' }],
    name: 'InvalidEthereumAddressOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'bytes', type: 'bytes' }],
    name: 'InvalidOwnerBytesLength',
  },
  { type: 'error', inputs: [], name: 'KeyspaceKeyTypeCantBeNone' },
  {
    type: 'error',
    inputs: [{ name: 'selector', internalType: 'bytes4', type: 'bytes4' }],
    name: 'SelectorNotAllowed',
  },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  { type: 'error', inputs: [], name: 'UnauthorizedCallContext' },
  { type: 'error', inputs: [], name: 'UpgradeFailed' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AccountFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const accountFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'implementation_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'controller', internalType: 'address', type: 'address' },
      { name: 'storageHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createAccount',
    outputs: [
      {
        name: 'account',
        internalType: 'contract CoinbaseSmartWallet',
        type: 'address',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'controller', internalType: 'address', type: 'address' },
      { name: 'storageHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'initCodeHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  { type: 'error', inputs: [], name: 'KeyRequired' },
] as const

export const accountFactoryAddress =
  '0xFB739503f4C342E1eef28a42c83f89353873784E' as const

export const accountFactoryConfig = {
  address: accountFactoryAddress,
  abi: accountFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AnchorStateRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const anchorStateRegistryAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_disputeGameFactory',
        internalType: 'contract IDisputeGameFactory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'InvalidGameStatus' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  { type: 'error', inputs: [], name: 'UnregisteredGame' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'Initialized',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'GameType', type: 'uint32' }],
    name: 'anchors',
    outputs: [
      { name: 'root', internalType: 'Hash', type: 'bytes32' },
      { name: 'l2BlockNumber', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'disputeGameFactory',
    outputs: [
      {
        name: '',
        internalType: 'contract IDisputeGameFactory',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_startingAnchorRoots',
        internalType: 'struct AnchorStateRegistry.StartingAnchorRoot[]',
        type: 'tuple[]',
        components: [
          { name: 'gameType', internalType: 'GameType', type: 'uint32' },
          {
            name: 'outputRoot',
            internalType: 'struct OutputRoot',
            type: 'tuple',
            components: [
              { name: 'root', internalType: 'Hash', type: 'bytes32' },
              {
                name: 'l2BlockNumber',
                internalType: 'uint256',
                type: 'uint256',
              },
            ],
          },
        ],
      },
      {
        name: '_superchainConfig',
        internalType: 'contract SuperchainConfig',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_game',
        internalType: 'contract IFaultDisputeGame',
        type: 'address',
      },
    ],
    name: 'setAnchorState',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'superchainConfig',
    outputs: [
      { name: '', internalType: 'contract SuperchainConfig', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tryUpdateAnchorState',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
] as const

export const anchorStateRegistryAddress =
  '0x4C8BA32A5DAC2A720bb35CeDB51D6B067D104205' as const

export const anchorStateRegistryConfig = {
  address: anchorStateRegistryAddress,
  abi: anchorStateRegistryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BridgedKeystore
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const bridgedKeystoreAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'anchorStateRegistry_',
        internalType: 'address',
        type: 'address',
      },
      { name: 'keystore_', internalType: 'address', type: 'address' },
      { name: 'refChainId_', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'activeForks',
    outputs: [{ name: 'activeFork', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'anchorStateRegistry',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'valueHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'confirmedValueHashStorageProof',
        internalType: 'bytes[]',
        type: 'bytes[]',
      },
    ],
    name: 'isValueHashCurrent',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'keystore',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'keystoreStorageRoot',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'l1BlockNumber',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'confirmedValueHashStorageProof',
        internalType: 'bytes[]',
        type: 'bytes[]',
      },
      {
        name: 'currentValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'newValueHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'newValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'l1BlockData', internalType: 'bytes', type: 'bytes' },
      {
        name: 'controllerProofs',
        internalType: 'struct ControllerProofs',
        type: 'tuple',
        components: [
          { name: 'updateProof', internalType: 'bytes', type: 'bytes' },
          { name: 'updatedValueProof', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'preconfirmUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'confirmedValueHashStorageProof',
        internalType: 'bytes[]',
        type: 'bytes[]',
      },
      {
        name: 'confirmedValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'newValueHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'newValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'conflictingIndex', internalType: 'uint256', type: 'uint256' },
      {
        name: 'conflictingValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'l1BlockData', internalType: 'bytes', type: 'bytes' },
      {
        name: 'controllerProofs',
        internalType: 'struct ControllerProofs',
        type: 'tuple',
        components: [
          { name: 'updateProof', internalType: 'bytes', type: 'bytes' },
          { name: 'updatedValueProof', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'preconfirmUpdateWithFork',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'fork', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'preconfirmedValueHashes',
    outputs: [
      { name: 'valueHashes', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'refChainId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'keystoreStorageRootProof',
        internalType: 'struct KeystoreStorageRootProof',
        type: 'tuple',
        components: [
          { name: 'l1BlockHeaderRlp', internalType: 'bytes', type: 'bytes' },
          {
            name: 'l1BlockHashProof',
            internalType: 'struct L1BlockHashProof',
            type: 'tuple',
            components: [
              {
                name: 'proofType',
                internalType: 'enum L1ProofType',
                type: 'uint8',
              },
              { name: 'proofData', internalType: 'bytes', type: 'bytes' },
            ],
          },
          {
            name: 'anchorStateRegistryAccountProof',
            internalType: 'bytes[]',
            type: 'bytes[]',
          },
          {
            name: 'anchorStateRegistryStorageProof',
            internalType: 'bytes[]',
            type: 'bytes[]',
          },
          {
            name: 'keystoreAccountProof',
            internalType: 'bytes[]',
            type: 'bytes[]',
          },
          { name: 'l2StateRoot', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'l2MessagePasserStorageRoot',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          { name: 'l2BlockHash', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
    ],
    name: 'syncKeystoreStorageRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32', indexed: false },
      {
        name: 'newValueHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'KeystoreRecordUpdatePreconfirmed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'keystoreStorageRoot',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'l1BlockNumber',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'KeystoreRootSynchronized',
  },
  {
    type: 'error',
    inputs: [
      { name: 'l1Blockhash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'expectedL1BlockHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'BlockHashMismatch',
  },
  {
    type: 'error',
    inputs: [
      { name: 'blockHeaderHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'blockHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'InvalidBlockHeader',
  },
  {
    type: 'error',
    inputs: [
      { name: 'confirmedNonce', internalType: 'uint256', type: 'uint256' },
      { name: 'preconfirmedNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidConflictingNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidL2OutputRootPreimages' },
  {
    type: 'error',
    inputs: [
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
      { name: 'newNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidUpdate' },
  {
    type: 'error',
    inputs: [
      { name: 'provenL1BlockNumber', internalType: 'uint256', type: 'uint256' },
      {
        name: 'provingL1BlockNumber',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'KeystoreStorageRootProofStale',
  },
  {
    type: 'error',
    inputs: [
      { name: 'commonValueHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'NoValueHashConflict',
  },
  {
    type: 'error',
    inputs: [
      { name: 'valueHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'valueHashFromPreimages',
        internalType: 'bytes32',
        type: 'bytes32',
      },
    ],
    name: 'RecordValueMismatch',
  },
  { type: 'error', inputs: [], name: 'UnauthorizedUpdate' },
] as const

export const bridgedKeystoreAddress =
  '0x65C1Cf5a8c14D7C787aD32ffFEDD8a1062c0B050' as const

export const bridgedKeystoreConfig = {
  address: bridgedKeystoreAddress,
  abi: bridgedKeystoreAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const entryPointAbi = [
  {
    type: 'function',
    inputs: [
      { name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct UserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              {
                name: 'callGasLimit',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'verificationGasLimit',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'preVerificationGas',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'maxFeePerGas',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'maxPriorityFeePerGas',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'paymasterAndData',
                internalType: 'bytes',
                type: 'bytes',
              },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          {
            name: 'aggregator',
            internalType: 'contract IAggregator',
            type: 'address',
          },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          {
            name: 'verificationGasLimit',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'preVerificationGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unlockStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'withdrawAddress',
        internalType: 'address payable',
        type: 'address',
      },
    ],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'withdrawAddress',
        internalType: 'address payable',
        type: 'address',
      },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'userOpHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'factory',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'paymaster',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalDeposit',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'aggregator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalStaked',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'unstakeDelaySec',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'withdrawTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'withdrawAddress',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'userOpHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'paymaster',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'nonce',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      {
        name: 'actualGasCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'actualGasUsed',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'userOpHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'nonce',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'revertReason',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'withdrawAddress',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
      { name: 'paid', internalType: 'uint256', type: 'uint256' },
      { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
      { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
      { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
      { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionResult',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
          { name: 'paymasterContext', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'senderInfo',
        internalType: 'struct IStakeManager.StakeInfo',
        type: 'tuple',
        components: [
          { name: 'stake', internalType: 'uint256', type: 'uint256' },
          { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'factoryInfo',
        internalType: 'struct IStakeManager.StakeInfo',
        type: 'tuple',
        components: [
          { name: 'stake', internalType: 'uint256', type: 'uint256' },
          { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'paymasterInfo',
        internalType: 'struct IStakeManager.StakeInfo',
        type: 'tuple',
        components: [
          { name: 'stake', internalType: 'uint256', type: 'uint256' },
          { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'ValidationResult',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
          { name: 'paymasterContext', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'senderInfo',
        internalType: 'struct IStakeManager.StakeInfo',
        type: 'tuple',
        components: [
          { name: 'stake', internalType: 'uint256', type: 'uint256' },
          { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'factoryInfo',
        internalType: 'struct IStakeManager.StakeInfo',
        type: 'tuple',
        components: [
          { name: 'stake', internalType: 'uint256', type: 'uint256' },
          { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'paymasterInfo',
        internalType: 'struct IStakeManager.StakeInfo',
        type: 'tuple',
        components: [
          { name: 'stake', internalType: 'uint256', type: 'uint256' },
          { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'aggregatorInfo',
        internalType: 'struct IEntryPoint.AggregatorStakeInfo',
        type: 'tuple',
        components: [
          { name: 'aggregator', internalType: 'address', type: 'address' },
          {
            name: 'stakeInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              {
                name: 'unstakeDelaySec',
                internalType: 'uint256',
                type: 'uint256',
              },
            ],
          },
        ],
      },
    ],
    name: 'ValidationResultWithAggregation',
  },
] as const

export const entryPointAddress =
  '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as const

export const entryPointConfig = {
  address: entryPointAddress,
  abi: entryPointAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Keystore
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const keystoreAbi = [
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'records',
    outputs: [{ name: 'valueHash', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'currentValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'newValueHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'newValueHashPreimages',
        internalType: 'struct ValueHashPreimages',
        type: 'tuple',
        components: [
          { name: 'controller', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint96', type: 'uint96' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'l1BlockData', internalType: 'bytes', type: 'bytes' },
      {
        name: 'controllerProofs',
        internalType: 'struct ControllerProofs',
        type: 'tuple',
        components: [
          { name: 'updateProof', internalType: 'bytes', type: 'bytes' },
          { name: 'updatedValueProof', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'set',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'bytes32', type: 'bytes32', indexed: false },
      {
        name: 'newValueHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'KeystoreRecordSet',
  },
  {
    type: 'error',
    inputs: [
      { name: 'l1Blockhash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'expectedL1BlockHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'BlockHashMismatch',
  },
  {
    type: 'error',
    inputs: [
      { name: 'blockHeaderHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'blockHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'InvalidBlockHeader',
  },
  {
    type: 'error',
    inputs: [
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
      { name: 'newNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidUpdate' },
  {
    type: 'error',
    inputs: [
      { name: 'valueHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'valueHashFromPreimages',
        internalType: 'bytes32',
        type: 'bytes32',
      },
    ],
    name: 'RecordValueMismatch',
  },
  { type: 'error', inputs: [], name: 'UnauthorizedUpdate' },
] as const

export const keystoreAddress =
  '0x8346284b016A22d23EbA31966cffc05b617DC32A' as const

export const keystoreConfig = {
  address: keystoreAddress,
  abi: keystoreAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// L1Block
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const l1BlockAbi = [
  {
    type: 'function',
    inputs: [],
    name: 'DEPOSITOR_ACCOUNT',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'basefee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'batcherHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'hash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'l1FeeOverhead',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'l1FeeScalar',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'number',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'sequenceNumber',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_number', internalType: 'uint64', type: 'uint64' },
      { name: '_timestamp', internalType: 'uint64', type: 'uint64' },
      { name: '_basefee', internalType: 'uint256', type: 'uint256' },
      { name: '_hash', internalType: 'bytes32', type: 'bytes32' },
      { name: '_sequenceNumber', internalType: 'uint64', type: 'uint64' },
      { name: '_batcherHash', internalType: 'bytes32', type: 'bytes32' },
      { name: '_l1FeeOverhead', internalType: 'uint256', type: 'uint256' },
      { name: '_l1FeeScalar', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setL1BlockValues',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'timestamp',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
] as const

export const l1BlockAddress =
  '0x4200000000000000000000000000000000000015' as const

export const l1BlockConfig = {
  address: l1BlockAddress,
  abi: l1BlockAbi,
} as const
