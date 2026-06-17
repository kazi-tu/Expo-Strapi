import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('SPACES_CDN_BASE_URL'),
        rootPath: env('SPACES_ROOT_PATH', 'EXPO'),
        s3Options: {
          credentials: {
            accessKeyId: env('SPACES_KEY'),
            secretAccessKey: env('SPACES_SECRET'),
          },
          endpoint: env('SPACES_ENDPOINT'),
          region: env('SPACES_REGION'),
          params: {
            ACL: env('SPACES_ACL', 'public-read'),
            Bucket: env('SPACES_BUCKET'),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});

export default config;
