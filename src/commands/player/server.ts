import { PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { connected_players } from '../../utill/types'
import { getPlayerList } from '../../utill/functions'
import { servers_req } from '../../utill/servers'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'list the players currently online',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.SendMessages,
	options: [servers_req]
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const server_id = options.server as string
	const list = (await getPlayerList(server_id)) as connected_players

	return { content: JSON.stringify(list) }
}
