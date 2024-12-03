# Keyspace Client Library

A Keyspace client library implemented in TypeScript. This client is also the basis for the [Keyspace documentation](https://docs.key.space/).

## Install Dependencies
```bash
bun install
```

## Create Private Keys

### secp256k1 (Ethereum EOA)

```bash
cast wallet new
```

### P256 (secp256r1, Passkeys)

```bash
bun run scripts/create-p256-key.ts
```

## Configuration

`bun` automatically loads environment variables from a `.env` file. Create a `.env` file in the root of the project.

```bash
touch .env
```

| Environment Variable | Description |
| --- | --- |
| RPC_URL | Ethereum RPC URL for general RPC calls |
| BUNDLER_RPC_URL | Ethereum RPC URL for ERC-4337 calls |
| KEYSPACE_RPC_URL | Keyspace RPC URL |
| RECOVERY_RPC_URL | Recovery Service RPC URL |

## Scripts

### Get Account
```bash
bun run scripts/get-account.ts
```

| Argument | Environment Variable | Description |
| --- | --- | --- |
| --private-key | PRIVATE_KEY | secp256k1 private key or P256 JWK |
| --signature-type | | secp256k1 (default) or webauthn |

### Send ETH
```bash
bun run scripts/send-eth.ts
```

| Argument | Environment Variable | Description |
| --- | --- | --- |
| --account | | The account of the keystore wallet to send from |
| --owner-index | | The index of the owner (default: 0) |
| --initial-config-data | | The initial config data needed to deploy the wallet |
| --private-key | PRIVATE_KEY | secp256k1 private key or P256 JWK |
| --to | | The address to send to |
| --signature-type | | secp256k1 (default) or webauthn |

Make sure there's ETH in the account you're sending from. You can get the Ethereum address of the smart wallet by running `bun run scripts/get-account.ts`.


### Change Owner
```bash
bun run scripts/change-owner.ts
```

| Argument | Environment Variable | Description |
| --- | --- | --- |
| --account | | The account of the keystore wallet |
| --owner-index | | The index of the owner (default: 0) |
| --initial-config-data | | The initial config data needed to deploy the wallet |
| --private-key | PRIVATE_KEY | Current private key of the owner |
| --config-data | | Current config data for the keystore wallet (hex string) |
| --owner-bytes | | The owner bytes to change in the keystore wallet |
| --signature-type | | secp256k1 (default) or webauthn |
| --remove | | Flag to remove the owner instead of adding (optional) |

## Build Documentation

```bash
bun run docs:dev
bun run docs:build
```
