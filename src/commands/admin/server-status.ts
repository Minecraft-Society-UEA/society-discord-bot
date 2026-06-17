import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllServersAll, fetchServerPlayers, db_server } from '~/utill'

export const config = createCommandConfig({
	description: 'Show all servers with online status and player counts',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	await interaction.deferReply({ ephemeral: true })

	const servers = (await getAllServersAll()) as db_server[] | null
	if (!servers) {
		await interaction.editReply({ content: '❌ No servers found in the database.' })
		return
	}

	const embed = new EmbedBuilder().setTitle('🖥️ Server Status').setColor('Blue').setTimestamp()

	for (const server of servers) {
		let playerCount = server.currently_online ?? 0

		const players = await fetchServerPlayers(server, { signal: AbortSignal.timeout(5000) })
		const reachable = players !== null
		if (players !== null) playerCount = players.length

		const statusIcon = reachable ? '🟢' : '🔴'
		embed.addFields({
			name: `${server.emoji ?? ''} ${server.name}`,
			value: `${statusIcon} ${reachable ? `Online — **${playerCount}** players` : 'Unreachable'}`,
			inline: true
		})
	}

	await interaction.editReply({ embeds: [embed] })
}
