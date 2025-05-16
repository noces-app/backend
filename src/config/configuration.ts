export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/events-app',
  },

  oidc: {
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: process.env.OIDC_REDIRECT_URI,
    postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
    scope: process.env.OIDC_SCOPE || 'openid profile email',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  },

  session: {
    secret:
      process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    cookieName: process.env.COOKIE_NAME || 'session.token',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000', 10),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'dev-str',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'dev-webhook-secret',
  },
});
