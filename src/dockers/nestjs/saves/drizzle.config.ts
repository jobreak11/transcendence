
import "dotenv/config"

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: "./src/drizzle/schema/**.schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		host: process.env.POSTGRES_HOST || 'localhost',
		port: Number(process.env.POSTGRES_PORT || 5432),
		database: process.env.POSTGRES_DB || 'postgres',
		password: process.env.POSTGRES_PASSWORD || '',
		user: process.env.POSTGRES_USER || 'postgres',
		ssl: false
	},
});