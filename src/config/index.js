const { env } = require("./env");

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  host: "0.0.0.0",

  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    bcryptRounds: env.BCRYPT_ROUNDS,
  },

  cors: {
    origin: env.CORS_ORIGIN || true, // fallback to current behavior
    credentials: true,
  },
};

module.exports = { config };