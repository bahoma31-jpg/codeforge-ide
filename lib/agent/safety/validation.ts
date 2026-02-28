/**
 * CodeForge IDE — Runtime Validation with Zod
 *
 * This module ensures type safety and runtime verification for Tool Arguments.
 */

import { z } from 'zod';
import { logger } from '@/lib/monitoring/error-logger';

// Helper for numbers that might be sent as strings
const OptionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === '') return undefined;
    const num = Number(v);
    return isNaN(num) ? undefined : num;
  });

// Zod Schema to extract common args safely from any tool call
export const CommonArgsSchema = z
  .object({
    path: z.string().optional(),
    filePath: z.string().optional(),
    owner: z.string().optional(),
    repo: z.string().optional(),
    branch: z.string().optional(),
    nodeId: z.string().optional(),
    fileId: z.string().optional(),
    name: z.string().optional(),
    query: z.string().optional(),
    newName: z.string().optional(),
    message: z.string().optional(),
    title: z.string().optional(),
    files: z
      .array(z.object({ path: z.string().optional() }).passthrough())
      .optional(),
    paths: z.array(z.string()).optional(),
    maxCount: OptionalNumber,
    pullNumber: OptionalNumber,
    issueNumber: OptionalNumber,
  })
  .passthrough();

export type CommonToolArgs = z.infer<typeof CommonArgsSchema>;

/**
 * Validates tool arguments at runtime without throwing errors.
 * Instead, logs the issue and returns a safe fallback.
 */
export function validateToolArgs(
  toolName: string,
  args: unknown
): CommonToolArgs {
  try {
    return CommonArgsSchema.parse(args || {});
  } catch (error) {
    logger.warn(
      `فشل التحقق من مدخلات الأداة (Zod): ${toolName}`,
      error instanceof Error ? error : undefined,
      {
        source: 'validateToolArgs',
        toolName,
        // Stringify args safely (handle circular refs just in case)
        args:
          typeof args === 'object'
            ? JSON.stringify(args).slice(0, 500)
            : String(args),
      }
    );
    // Return empty object on fail to not break UI, just fallback to defaults
    return {};
  }
}
