# scw-tx

A repository with scripts to interact with [Smart Wallet](https://github.com/coinbase/smart-wallet). 
This is mostly a scratch work repo that I am sharing as people have been asking for example code. It would be better to see some of the code here refactored to leverage a SmartWallet account type in Permissionless.js or AA-SDK. 

**Install Dependencies**
```bash
bun install
```

**Configure**
```bash
touch .env
```

Generate a secp256r1 jwk and write to your `.env`
```bash
bun scripts/createP256Key.ts >> .env
```

In your `.env` declare a `RPC_URL`. This should be a for a node that supports both normal Ethereum RPC and ERC-4337 RPCs, such as Alchemy or Stackup. 

```
RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
```

If you are running `MagicSpend` scripts, you will also need a `PRIVATE_KEY` value in your `.env`, which should be an Ethereum private key. See `scripts/magicSpend/README.md` for more details. 


**Run a Script**
```bash
bun run scripts/createAccount.ts
```

**Running tests**
```bash
bun test --watch
```