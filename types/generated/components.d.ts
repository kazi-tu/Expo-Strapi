import type { Schema, Struct } from '@strapi/strapi';

export interface ProgrammeSession extends Struct.ComponentSchema {
  collectionName: 'components_programme_sessions';
  info: {
    description: 'Programme session entry';
    displayName: 'Session';
  };
  attributes: {
    description: Schema.Attribute.Text;
    tag: Schema.Attribute.String;
    time: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'programme.session': ProgrammeSession;
    }
  }
}
