import { z } from 'zod';

export const resourceSchemas = {
  fetchResources: z.object({
    topic: z.string()
      .min(3, 'Topic must be at least 3 characters')
      .max(100, 'Topic cannot exceed 100 characters')
      .regex(
        /^[a-zA-Z0-9\s\-_,.!?;:'"()\[\]{}@#$%^&*+=|<>~`]+$/,
        'Topic contains invalid characters'
      ),
  }),
};
