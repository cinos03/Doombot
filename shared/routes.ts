import { z } from 'zod';
import { insertSettingsSchema, insertAutopostTargetSchema, settings, summaries, logs, autopostTargets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertSettingsSchema,
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    trigger: {
      method: 'POST' as const,
      path: '/api/settings/trigger',
      responses: {
        200: z.object({ message: z.string() }),
      },
    }
  },
  summaries: {
    list: {
      method: 'GET' as const,
      path: '/api/summaries',
      responses: {
        200: z.array(z.custom<typeof summaries.$inferSelect>()),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect>()),
      },
    },
  },
  autopost: {
    list: {
      method: 'GET' as const,
      path: '/api/autopost',
      responses: {
        200: z.array(z.custom<typeof autopostTargets.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/autopost/:id',
      responses: {
        200: z.custom<typeof autopostTargets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/autopost',
      input: insertAutopostTargetSchema,
      responses: {
        200: z.custom<typeof autopostTargets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/autopost/:id',
      input: insertAutopostTargetSchema.partial(),
      responses: {
        200: z.custom<typeof autopostTargets.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/autopost/:id',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    check: {
      method: 'POST' as const,
      path: '/api/autopost/:id/check',
      responses: {
        200: z.object({ message: z.string(), found: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
