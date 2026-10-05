import { z } from "zod";
import connectToDatabase from "./mongodb";

export type ActionResult<T = unknown> =
  | {
      ok: true;
      data: T;
      message?: string;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export function successResult<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function errorResult(
  message: string,
  code: string = "BAD_REQUEST",
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      fieldErrors,
    },
  };
}

export async function withAction<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  input: unknown,
  handler: (validData: TInput) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  try {
    await connectToDatabase();
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed. Please check the provided inputs.",
          fieldErrors: flattened.fieldErrors as Record<string, string[]>,
        },
      };
    }

    const result = await handler(parsed.data);
    return {
      ok: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Action execution error:", err);
    return {
      ok: false,
      error: {
        code: "SERVER_ERROR",
        message: err instanceof Error ? err.message : "An unexpected server error occurred.",
      },
    };
  }
}
