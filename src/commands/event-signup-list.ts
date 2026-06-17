import { EmbedBuilder } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'

export const config = createCommandConfig({
	description: 'View the Hunger Games event signup list',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	if (!interaction.guild) return

	const playerIds = (await Flashcore.get<string[]>('hg-event-players')) ?? []
	const embed = new EmbedBuilder().setTitle('🏹 HG Event Signup List').setColor([136, 61, 255])

	if (playerIds.length === 0) {
		embed.setDescription('No signups yet.')
		return { embeds: [embed], flags: ['Ephemeral'] }
	}

	const names: string[] = []
	for (const id of playerIds) {
		try {
			const member = await interaction.guild.members.fetch(id)
			names.push(member.displayName)
		} catch {
			names.push(`<@${id}>`)
		}
	}

	embed
		.setDescription(names.map((n, i) => `${i + 1}. ${n}`).join('\n'))
		.setFooter({ text: `${playerIds.length}/24 spots filled` })

	return { embeds: [embed], flags: ['Ephemeral'] }
}
