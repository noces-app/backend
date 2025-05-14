export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10) || 3000,

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  // Keycloak
  keycloak: {
    url: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    publicKey: process.env.KEYCLOAK_PUBLIC_KEY,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});
