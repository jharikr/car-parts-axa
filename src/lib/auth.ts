import { betterAuth } from "better-auth";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db/index"; // your drizzle instance

const getAuth = createServerOnlyFn(() => betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true
    }
}))

export const auth = getAuth()