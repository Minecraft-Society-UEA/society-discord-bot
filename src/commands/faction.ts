import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllFactions } from '~/utill'

export const config = createCommandConfig({
	description: 'View faction info and find your faction thread',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	if (!interaction.guild) return

	const factions = await getAllFactions()
	const embed = new EmbedBuilder().setColor([136, 61, 255])

	if (factions.length === 0) {
		embed.setTitle('⚔️ No Factions').setDescription('No factions exist yet. Factions are created in-game.')
		return { embeds: [embed], flags: ['Ephemeral'] }
	}

	embed
		.setTitle('⚔️ Find Your Faction')
		.setDescription(
			'Check the faction threads below to find yours. In-game faction membership tracking is coming soon.\n\n' +
				factions
					.map((f) => {
						const threadLink = f.thread_id
							? `[${f.thread_name ?? f.faction_name}](https://discord.com/channels/${interaction.guild!.id}/${f.thread_id})`
							: f.faction_name
						return `• **${f.faction_name}** — ${threadLink}`
					})
					.join('\n')
		)

	return { embeds: [embed], flags: ['Ephemeral'] }
}
