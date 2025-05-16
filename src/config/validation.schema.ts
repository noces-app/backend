import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  CLIENT_URL: Joi.string().required(),

  MONGODB_URI: Joi.string().required(),

  OIDC_ISSUER: Joi.string().required(),
  OIDC_CLIENT_ID: Joi.string().required(),
  OIDC_CLIENT_SECRET: Joi.string().required(),
  OIDC_REDIRECT_URI: Joi.string().required(),
  OIDC_POST_LOGOUT_REDIRECT_URI: Joi.string().required(),
  OIDC_SCOPE: Joi.string().default('openid profile email'),

  SESSION_SECRET: Joi.string()
    .min(32)
    .default('dev-session-secret-change-in-production'),
  COOKIE_NAME: Joi.string().default('session.token'),
  COOKIE_MAX_AGE: Joi.number().default(86400000),

  JWT_SECRET: Joi.string()
    .min(32)
    .default('dev-secret-key-change-in-production'),
  JWT_EXPIRATION: Joi.string().default('1h'),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
});
