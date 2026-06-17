export {}
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_OPTIONS: string
			DISCORD_CLIENT_ID: string
			DISCORD_TOKEN: string
			DISCORD_GUILD_ID: string
			DISCORD_DEBUG_CHANNEL_ID: string
			PTERODACTYL_URL: string
			PTERODACTYL_KEY: string
			DB_HOST: string
			DB_PORT: number
			DB_DATABASE: string
			DB_USERNAME: string
			DB_PASSWORD: string
			DB_URI: string
			GMAIL_USER: string
			GMAIL_PASS: string
			DISCORD_LOGGING_CHANNEL_ID: string
			SERVER_LIST_CHANNEL_ID: string
			QUOTE_WALL_CHANNEL_ID: string
			INTRO_CHANNLE_ID: string
			SU_MEMBER_PAGE: string
			SU_LOGIN_PAGE: string
			SU_USER: string
			SU_PASS: string
		}
	}
}
