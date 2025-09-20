import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { all_player_list } from '../../utill/types'
import { getPlayerListAllServers } from '../../utill/functions'

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

	// create embed with total player and what servers there on
	embed
		.setColor('DarkPurple')
		.setTitle('✦ Online players across all servers:')
		.setDescription(`Online: ${list.total_online}/300`)
		.addFields(
			{
				name: `🏠︎ The Hub: ${list.hub.online_players.length} players`,
				value: `${list.hub.online_players.map((player) => player.name).join(', ')}`
			},
			{
				name: `⚔️ Survival: ${list.survival.online_players.length} players`,
				value: `${list.survival.online_players.map((player) => player.name).join(', ')}`
			},
			{
				name: `🎨 Creative: ${list.creative.online_players.length} players`,
				value: `${list.creative.online_players.map((player) => player.name).join(', ')}`
			},
			{
				name: `🎊 Event: ${list.event.online_players.length} players`,
				value: `${list.event.online_players.map((player) => player.name).join(', ')}`
			}
		)
		.setTimestamp()

	return { embeds: [embed] }
}
