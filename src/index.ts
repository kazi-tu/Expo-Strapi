import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';

const publicReadActions = [
  'api::homepage.homepage.find',
  'api::expo-page.expo-page.find',
  'api::exhibitor.exhibitor.find',
  'api::exhibitor.exhibitor.findOne',
  'api::support-unit.support-unit.find',
  'api::support-unit.support-unit.findOne',
  'api::programme-day.programme-day.find',
  'api::programme-day.programme-day.findOne',
];

const expoOverviewSeed = {
  overviewGuests: [
    {
      imageUrl: '/assets/honored-guests/tito-mutai.jpg',
      alt: 'Tito Mutai speaking at the 2026 - Africa International Agricultural Expo',
      name: 'Tito Mutai',
      title: 'Chief Executive Officer',
      org: 'Agri Africa Exhibition Ltd.',
    },
    {
      imageUrl: '/assets/honored-guests/mutahi-kagwe.jpeg',
      alt: 'Honorable Senator Mutahi Kagwe',
      name: 'Hon. Sen. Mutahi Kagwe',
      title: 'Cabinet Secretary',
      org: 'Ministry of Agriculture & Livestock Development',
    },
    {
      imageUrl: '/assets/honored-guests/johnson-sakaja.jpeg',
      alt: 'Governor Johnson Sakaja',
      name: 'H.E. Johnson Sakaja',
      title: 'Governor',
      org: 'Nairobi City County',
    },
  ],
  overviewObjectives: [
    {
      title: 'Showcase global innovation',
      copy: 'Showcasing global agricultural innovations and technologies to the African continent.',
    },
    {
      title: 'Highlight African capability',
      copy: "Highlighting Africa's capabilities and strengths in agriculture.",
    },
    {
      title: 'Strengthen trade relationships',
      copy: 'Strengthening mutually beneficial trade relationships between Africa and international partners.',
    },
    {
      title: 'Promote investment',
      copy: "Identifying and promoting investment opportunities in Africa's agricultural sector.",
    },
  ],
  overviewCategories: [
    { label: 'Honey' },
    { label: 'Mushroom' },
    { label: 'Seed Propagation' },
    { label: 'Poultry' },
    { label: 'Dairy' },
    { label: 'Livestock & Meat' },
    { label: 'Animal Health' },
    { label: 'Plant Health' },
    { label: 'Herbs & Spices' },
  ],
};

function hasItems(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function getGuestImagePath(imageUrl: string) {
  const filename = path.basename(imageUrl);
  return path.resolve(
    '/home/kiptum/Projects/Personal_projects/Murage/Expo/public/assets/honored-guests',
    filename
  );
}

function getMimeType(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }

  if (extension === '.png') {
    return 'image/png';
  }

  if (extension === '.webp') {
    return 'image/webp';
  }

  return 'application/octet-stream';
}

async function ensureGuestImageInMediaLibrary(strapi: Core.Strapi, guest: {
  imageUrl: string;
  alt: string;
  name: string;
}) {
  if (!guest.imageUrl.startsWith('/assets/honored-guests/')) {
    return guest.imageUrl;
  }

  const absolutePath = getGuestImagePath(guest.imageUrl);
  const originalFilename = path.basename(absolutePath);

  const existingFile = await strapi.db.query('plugin::upload.file').findOne({
    where: { name: originalFilename },
  });

  if (existingFile && typeof existingFile.url === 'string' && existingFile.url.length > 0) {
    return existingFile.url;
  }

  if (!fs.existsSync(absolutePath)) {
    return guest.imageUrl;
  }

  const stats = fs.statSync(absolutePath);
  const uploaded = await strapi.plugin('upload').service('upload').upload({
    data: {
      fileInfo: {
        name: originalFilename,
        alternativeText: guest.alt,
        caption: guest.name,
      },
    },
    files: {
      filepath: absolutePath,
      originalFilename,
      mimetype: getMimeType(originalFilename),
      size: stats.size,
    },
  });

  const firstUpload = Array.isArray(uploaded) ? uploaded[0] : null;
  return firstUpload && typeof firstUpload.url === 'string' ? firstUpload.url : guest.imageUrl;
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const existingPermissions = await strapi.db
      .query('plugin::users-permissions.permission')
      .findMany({
        where: { role: publicRole.id },
      });

    for (const action of publicReadActions) {
      const existingPermission = existingPermissions.find(
        (permission: { action?: string }) => permission.action === action
      );

      if (existingPermission) {
        await strapi.db.query('plugin::users-permissions.permission').update({
          where: { id: existingPermission.id },
          data: { enabled: true },
        });
        continue;
      }

      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: publicRole.id,
          enabled: true,
        },
      });
    }

    const expoPages = await strapi.db.query('api::expo-page.expo-page').findMany({
      limit: 1,
    });

    const expoPage = expoPages[0] as
      | {
          id: number;
          overviewGuests?: unknown;
          overviewObjectives?: unknown;
          overviewCategories?: unknown;
          publishedAt?: string | null;
        }
      | undefined;

    if (!expoPage) return;

    const nextData: Record<string, unknown> = {};

    if (!hasItems(expoPage.overviewGuests)) {
      nextData.overviewGuests = expoOverviewSeed.overviewGuests;
    }

    if (!hasItems(expoPage.overviewObjectives)) {
      nextData.overviewObjectives = expoOverviewSeed.overviewObjectives;
    }

    if (!hasItems(expoPage.overviewCategories)) {
      nextData.overviewCategories = expoOverviewSeed.overviewCategories;
    }

    if (Object.keys(nextData).length > 0) {
      if (!expoPage.publishedAt) {
        nextData.publishedAt = new Date().toISOString();
      }

      await strapi.db.query('api::expo-page.expo-page').update({
        where: { id: expoPage.id },
        data: nextData,
      });
    }

    const expoPagesToSync = await strapi.db.query('api::expo-page.expo-page').findMany({});

    for (const currentPage of expoPagesToSync as Array<{
      id: number;
      overviewGuests?: unknown;
    }>) {
      if (!Array.isArray(currentPage.overviewGuests) || currentPage.overviewGuests.length === 0) {
        continue;
      }

      const nextGuests = await Promise.all(
        currentPage.overviewGuests.map(async (item) => {
          if (!item || typeof item !== 'object') return item;
          const guest = item as { imageUrl?: unknown; alt?: unknown; name?: unknown };
          if (
            typeof guest.imageUrl !== 'string' ||
            typeof guest.alt !== 'string' ||
            typeof guest.name !== 'string'
          ) {
            return item;
          }

          const uploadedUrl = await ensureGuestImageInMediaLibrary(strapi, {
            imageUrl: guest.imageUrl,
            alt: guest.alt,
            name: guest.name,
          });

          return {
            ...(item as Record<string, unknown>),
            imageUrl: uploadedUrl,
          };
        })
      );

      const changed = nextGuests.some((item, index) => {
        const previous = currentPage.overviewGuests?.[index] as { imageUrl?: unknown } | undefined;
        return previous?.imageUrl !== (item as { imageUrl?: unknown })?.imageUrl;
      });

      if (!changed) continue;

      await strapi.db.query('api::expo-page.expo-page').update({
        where: { id: currentPage.id },
        data: {
          overviewGuests: nextGuests,
          updatedAt: new Date(),
        },
      });
    }
  },
};
