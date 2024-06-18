# Example Keyspace Client

An example Keyspace client implemented in TypeScript. This client is the basis for the [Keyspace documentation](https://docs.key.space/) and will eventually become a client library for Keyspace.

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

### Get Keyspace Key
```bash
bun run scripts/get-keyspace-key.ts
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
| --keyspace-key | KEYSPACE_KEY | The wallet's Keyspace key |
| --private-key | PRIVATE_KEY | secp256k1 private key or P256 JWK |
| --signature-type | | secp256k1 (default) or webauthn |

Make sure there's ETH in the account you're sending from. You can get the Ethereum address of the smart wallet by running `bun run scripts/get-keyspace-key.ts`.


### Change Owner
```bash
bun run scripts/change-owner.ts
```

| Argument | Environment Variable | Description |
| --- | --- | --- |
| --keyspace-key | KEYSPACE_KEY | The wallet's Keyspace key |
| --private-key | PRIVATE_KEY | secp256k1 private key or P256 JWK |
| --new-private-key | NEW_PRIVATE_KEY | new secp256k1 private key or P256 JWK |
| --signature-type | | secp256k1 (default) or webauthn |

## Build Documentation

```bash
bun run docs:dev
bun run docs:build
```
