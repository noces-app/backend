export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10) || 3000,

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  // OpenID Connect (OIDC)
  oidc: {
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: process.env.OIDC_REDIRECT_URI,
    postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
    scope: process.env.OIDC_SCOPE || 'openid profile email',
  },

  // Session & Cookie settings
  session: {
    secret: process.env.SESSION_SECRET,
    cookieName: process.env.COOKIE_NAME || 'session.token',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000', 10),
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});
