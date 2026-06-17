import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllServers, getAllPlayers, refreshOnlinePlayers, db_server, db_online_player } from '~/utill'

export const config = createCommandConfig({
	description: 'See who is currently online across all servers',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	await refreshOnlinePlayers()

	const servers = (await getAllServers()) as db_server[] | null
	const players = (await getAllPlayers()) as db_online_player[]

	if (!servers) {
		return { content: 'No servers found in the database.', flags: ['Ephemeral'] }
	}

	let totalOnline = 0
	const embed = new EmbedBuilder().setTitle('✦ Online Players').setColor([136, 61, 255]).setTimestamp()

	for (const server of servers) {
		const serverPlayers = players.filter((p) => p.server === server.id)
		totalOnline += serverPlayers.length
		embed.addFields({
			name: `${server.emoji} ${server.name}: ${serverPlayers.length} Players`,
			value: serverPlayers.length > 0 ? serverPlayers.map((p) => p.name).join(', ') : '​'
		})
	}

	embed.setDescription(`**${totalOnline}** player(s) online`)

	return { embeds: [embed], flags: ['Ephemeral'] }
}
