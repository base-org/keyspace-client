const ECDSA = require("ecdsa-secp256r1");

console.log(`P256_JWK=${JSON.stringify(ECDSA.generateKey().toJWK())}`);
