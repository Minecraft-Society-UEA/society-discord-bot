import { PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { servers_req } from '~/utill/servers'
import { createServer, updateServer } from '~/utill/database_functions'
import { db_server } from '~/utill/types'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'list the players currently online',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.SendMessages,
	options: [
		servers_req,
		{
			name: 'name',
			description: 'server name',
			type: 'string',
			required: true
		},
		{
			name: 'emoji',
			description: 'emoji or disocrd custom emoji id',
			type: 'string',
			required: true
		},
		{
			name: 'game_port',
			description: 'servers local port',
			type: 'string',
			required: true
		},
		{
			name: 'host',
			description: 'host ip inc http://',
			type: 'string',
			required: true
		},
		{
			name: 'user',
			description: 'restapi username',
			type: 'string',
			required: true
		},
		{
			name: 'password',
			description: 'restapi password',
			type: 'string',
			required: true
		},
		{
			name: 'rest_port',
			description: 'restapi port',
			type: 'string',
			required: true
		}
	]
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const server_id = options.server as string

	const server = (await createServer(server_id)) as db_server

	server.emoji = options.emoji
	server.game_port = options.game_port
	server.host = options.host
	server.name = options.name
	server.pass = options.password
	server.user = options.user
	server.port = options.rest_port

	await updateServer(server_id, server)

	return `added server`
}
