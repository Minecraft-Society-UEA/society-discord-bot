import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { all_player_list, db_server } from '../../utill/types'
import { getPlayerListAllServers } from '../../utill/functions'
import { getAllServers } from '~/utill/database_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'list the players currently online',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.SendMessages
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const embed = new EmbedBuilder()
	const list = (await getPlayerListAllServers()) as all_player_list
	const servers = (await getAllServers()) as db_server[]

	// create embed with total player and what servers there on
	embed
		.setColor('DarkPurple')
		.setTitle('✦ Online players across all servers:')
		.setDescription(`Online: ${list.total_online}/300`)
		.setTimestamp()

	for (const players of list.server_players) {
		const server = servers.filter((item) => item.id === players.id)[0] as db_server

		embed.addFields({
			name: `${server.emoji} ${server.name}: ${players.players.length} Players`,
			value: `${players.players.map((player) => player.name).join(', ')}`
		})
	}

	return { embeds: [embed] }
}
