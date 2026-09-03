import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, getMemberUserId, getSeasonStatsByUserId, getCurrentSeason, formatPlaytime, db_player } from '~/utill'

export const config = createCommandConfig({
	description: 'View your linked profile and verification status',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'ephemeral',
			description: 'whether the reply should only be visible to you (default: true)',
			type: 'boolean',
			required: false
		}
	]
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const ephemeral = options.ephemeral ?? true
	const profile = (await getProfileByDId(interaction.user.id)) as db_player | null
	const embed = new EmbedBuilder().setColor('Blue')

	if (!profile) {
		return {
			embeds: [
				embed
					.setTitle('❌ No profile found')
					.setDescription('You have not verified yet. Use `/verify mc` to get started.')
			],
			flags: ephemeral ? ['Ephemeral'] : undefined
		}
	}

	const member = await getMemberUserId(interaction.user.id)
	const maskedEmail = profile.uea_email ? `${profile.uea_email[0]}***@uea.ac.uk` : 'Not linked'
	const currentSeason = await getCurrentSeason()
	const seasonStats = await getSeasonStatsByUserId(interaction.user.id)
	const currentSeasonStat = seasonStats.find(s => s.season === currentSeason)

	const playtimeText = currentSeasonStat
		? formatPlaytime(currentSeasonStat.playtime_seconds)
		: 'No playtime recorded'

	const messageCountText = currentSeasonStat
		? currentSeasonStat.messages_sent.toString()
		: '0'

	embed
		.setTitle(`✦ ${interaction.user.displayName}'s Profile`)
		.setThumbnail(interaction.user.displayAvatarURL() ?? null)
		.addFields(
			{ name: 'MC Username', value: profile.mc_username ?? 'Not linked', inline: true },
			{ name: 'MC UUID', value: profile.mc_uuid ? `\`${profile.mc_uuid}\`` : 'Not linked', inline: true },
			{ name: 'UEA Email', value: maskedEmail, inline: true },
			{ name: 'Rank', value: profile.mc_rank, inline: true },
			{ name: 'Member', value: member ? '✅ Yes' : '❌ No', inline: true },
			{ name: 'Account Created', value: `${profile.created_at}`, inline: true },
			{ name: 'Playtime (This Season)', value: playtimeText, inline: true },
			{ name: 'Messages (This Season)', value: messageCountText, inline: true }
		)

	return { embeds: [embed], flags: ephemeral ? ['Ephemeral'] : undefined }
}
