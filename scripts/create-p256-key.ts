const P256 = require("ecdsa-secp256r1");

console.log(JSON.stringify(P256.generateKey().toJWK()));
