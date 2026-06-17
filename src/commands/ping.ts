import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllServers } from '~/utill'

export const config = createCommandConfig({
	description: 'Check bot latency and database status',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	const wsLatency = interaction.client.ws.ping
	const start = Date.now()

	let dbOk = false
	try {
		const servers = await getAllServers()
		dbOk = servers !== null
	} catch {}

	const dbLatency = Date.now() - start

	const embed = new EmbedBuilder()
		.setTitle('🏓 Pong!')
		.setColor(dbOk ? 'Green' : 'Yellow')
		.addFields(
			{ name: 'WebSocket Latency', value: `${wsLatency}ms`, inline: true },
			{ name: 'Database', value: dbOk ? `✅ Online (${dbLatency}ms)` : '❌ Error', inline: true }
		)

	return { embeds: [embed], flags: ['Ephemeral'] }
}
