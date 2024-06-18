const ECDSA = require("ecdsa-secp256r1");

console.log(JSON.stringify(ECDSA.generateKey().toJWK()));
