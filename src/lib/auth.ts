import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db/index"; // your drizzle instance

const getAuth = createServerOnlyFn(() => betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true
    },
    plugins: [tanstackStartCookies()]
}))

export const auth = getAuth()