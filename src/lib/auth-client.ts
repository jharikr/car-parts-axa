import 'dotenv/config';
import { createAuthClient } from "better-auth/react"

if (!process.env.BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is not set');

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
})

export const { signIn, signUp, useSession } = createAuthClient()