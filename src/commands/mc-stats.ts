import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, getPlayersByName, getServerByID, db_player, db_online_player, db_server, getSeasonStatsByUserId, formatPlaytime, getCurrentSeason } from '~/utill'

export const config = createCommandConfig({
	description: "View a player's current Minecraft status",
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to check (defaults to you)',
			type: 'member',
			required: false
		}
	],
	sage: { ephemeral: true }
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const user = options.user
	const userId = user?.id ?? interaction.user.id
	const displayName = user?.displayName ?? interaction.user.username

	const profile = (await getProfileByDId(userId)) as db_player | null
	if (!profile?.mc_username) {
		return { content: `${displayName} has no linked Minecraft account.`, flags: ['Ephemeral'] }
	}

	const season = await getCurrentSeason()
	const allStats = await getSeasonStatsByUserId(userId)
	const currentSeasonStats = allStats.find(s => s.season === season)

	const embed = new EmbedBuilder().setColor('Blue').setTitle(`📊 ${profile.mc_username}`)

	const online = (await getPlayersByName(profile.mc_username)) as db_online_player | false
	if (!online) {
		embed.setDescription('🔴 Currently offline').setThumbnail(user?.displayAvatarURL() ?? null).addFields(
			{ name: 'Rank', value: profile.mc_rank, inline: true },
			{ name: 'Playtime', value: formatPlaytime(currentSeasonStats?.playtime_seconds ?? 0), inline: true },
			{ name: 'Messages', value: `${currentSeasonStats?.messages_sent ?? 0}`, inline: true }
		)
		return { embeds: [embed], flags: ['Ephemeral'] }
	}

	const server = (await getServerByID(online.server)) as db_server | null

	embed
		.setDescription('🟢 Currently online')
		.setThumbnail(user?.displayAvatarURL() ?? null)
		.addFields(
			{ name: 'Server', value: server?.name ?? online.server, inline: true },
			{ name: 'Rank', value: profile.mc_rank, inline: true },
			{ name: 'Level', value: `${online.level ?? 0}`, inline: true },
			{ name: 'Health', value: `${online.health ?? 0}`, inline: true },
			{ name: 'Playtime', value: formatPlaytime(currentSeasonStats?.playtime_seconds ?? 0), inline: true },
			{ name: 'Messages', value: `${currentSeasonStats?.messages_sent ?? 0}`, inline: true }
		)

	return { embeds: [embed], flags: ['Ephemeral'] }
}
