import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // MongoDB
  MONGODB_URI: Joi.string().required(),

  // Keycloak
  KEYCLOAK_URL: Joi.string().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
  KEYCLOAK_CLIENT_SECRET: Joi.string().required(),
  KEYCLOAK_PUBLIC_KEY: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required().min(16),
  JWT_EXPIRATION: Joi.string().default('1h'),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
});
