import KeyvMysql from '@keyv/mysql'
import { Partials } from 'discord.js'
import type { Config } from 'robo.js'

export default <Config>{
	clientOptions: {
		intents: [
			'Guilds',
			'GuildMessages',
			'MessageContent',
			'AutoModerationConfiguration',
			'AutoModerationExecution',
			'DirectMessages',
			'GuildBans',
			'GuildModeration',
			'GuildMembers'
		],
		partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
	},
	plugins: [],
	type: 'robo',
	excludePaths: [`/src/commands/warn`, `/src/commands/admin/tmp`, `src/commands/verify/double-check.ts`],
	flashcore: {
		keyv: {
			store: new KeyvMysql({ uri: process.env.DB_URI })
		}
	}
}
