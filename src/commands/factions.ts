import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllFactions } from '~/utill'

export const config = createCommandConfig({
	description: 'List all active factions',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	if (!interaction.guild) return

	const factions = await getAllFactions()
	const embed = new EmbedBuilder().setTitle('⚔️ Factions').setColor([136, 61, 255])

	if (factions.length === 0) {
		embed.setDescription('No factions have been created yet.')
		return { embeds: [embed], flags: ['Ephemeral'] }
	}

	for (const faction of factions) {
		const threadLink = faction.thread_id
			? `[${faction.thread_name ?? faction.faction_name}](https://discord.com/channels/${interaction.guild.id}/${faction.thread_id})`
			: 'No thread'

		embed.addFields({
			name: faction.faction_name,
			value: threadLink,
			inline: true
		})
	}

	return { embeds: [embed], flags: ['Ephemeral'] }
}
