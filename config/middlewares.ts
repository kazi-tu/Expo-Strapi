import type { Core } from '@strapi/strapi';

const toOrigin = (value?: string) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const mediaOrigins = [
    'market-assets.strapi.io',
    toOrigin(env('SPACES_CDN_BASE_URL')),
    toOrigin(env('SPACES_ENDPOINT')),
    env('SPACES_BUCKET') && env('SPACES_REGION')
      ? `https://${env('SPACES_BUCKET')}.${env('SPACES_REGION')}.digitaloceanspaces.com`
      : null,
    env('SPACES_BUCKET') && env('SPACES_REGION')
      ? `https://${env('SPACES_BUCKET')}.${env('SPACES_REGION')}.cdn.digitaloceanspaces.com`
      : null,
  ].filter((value): value is string => Boolean(value));

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:', ...mediaOrigins],
            'media-src': ["'self'", 'data:', 'blob:', ...mediaOrigins],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
