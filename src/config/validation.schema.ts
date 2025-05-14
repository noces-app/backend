import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  CLIENT_URL: Joi.string().required(),

  // MongoDB
  MONGODB_URI: Joi.string().required(),

  // Keycloak OIDC
  OIDC_ISSUER: Joi.string().required(),
  OIDC_CLIENT_ID: Joi.string().required(),
  OIDC_CLIENT_SECRET: Joi.string().required(),
  OIDC_REDIRECT_URI: Joi.string().required(),
  OIDC_POST_LOGOUT_REDIRECT_URI: Joi.string().required(),
  OIDC_SCOPE: Joi.string().required(),

  // Session & Cookie settings
  SESSION_SECRET: Joi.string().required().min(32),
  COOKIE_NAME: Joi.string().required().default('session.token'),
  COOKIE_MAX_AGE: Joi.number().default(86400000),

  // JWT (for API security)
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRATION: Joi.string().default('1h'),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
});
