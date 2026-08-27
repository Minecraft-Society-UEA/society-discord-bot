import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getCurrentSeason, getSeasonLeaderboard, formatPlaytime } from '~/utill'

export const config = createCommandConfig({
	description: 'Top players by playtime or messages for the current season',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'metric',
			description: 'what to rank by',
			type: 'string',
			choices: [
				{ name: 'Playtime', value: 'playtime_seconds' },
				{ name: 'Messages sent', value: 'messages_sent' }
			],
			required: true
		},
		{
			name: 'season',
			description: 'which season to view (defaults to the current season)',
			type: 'string',
			required: false
		}
	],
	sage: { ephemeral: true }
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const metric = options.metric as 'playtime_seconds' | 'messages_sent'
	const season = options.season ?? (await getCurrentSeason())

	const rows = await getSeasonLeaderboard(season, metric, 10)

	if (rows.length === 0) {
		return { content: `No stats recorded for **${season}** yet.`, flags: ['Ephemeral'] }
	}

	const lines = rows.map((row, i) => {
		const name = row.mc_username ?? `<@${row.user_id}>`
		const value = metric === 'playtime_seconds' ? formatPlaytime(row.playtime_seconds) : `${row.messages_sent} messages`
		return `**${i + 1}.** ${name} — ${value}`
	})

	const embed = new EmbedBuilder()
		.setColor('Gold')
		.setTitle(`🏆 Leaderboard — ${metric === 'playtime_seconds' ? 'Playtime' : 'Messages'} (${season})`)
		.setDescription(lines.join('\n'))

	return { embeds: [embed], flags: ['Ephemeral'] }
}
