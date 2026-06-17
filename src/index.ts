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
  },
};
