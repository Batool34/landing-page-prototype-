import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PasswordSchema = z.object({
  password: z.string().min(1),
});

/**
 * Accepts ADMIN_PASSWORD from Lovable Secrets (recommended),
 * or VITE_ADMIN_PASSWORD from .env as a fallback.
 */
export const verifyAdminPassword = createServerFn({ method: "POST" })
  .validator(PasswordSchema)
  .handler(async ({ data }) => {
    const expected =
      process.env.ADMIN_PASSWORD ||
      process.env.VITE_ADMIN_PASSWORD ||
      process.env.FYLO_ADMIN_PASSWORD;

    if (!expected) {
      throw new Error(
        "Admin password not configured. In Lovable go to Cloud → Secrets → Add secret named ADMIN_PASSWORD.",
      );
    }

    if (data.password !== expected) {
      throw new Error("Wrong password.");
    }

    return { ok: true as const };
  });
