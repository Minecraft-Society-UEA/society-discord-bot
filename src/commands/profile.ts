import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getProfileByDId, getMemberUserId, db_player } from '~/utill'

export const config = createCommandConfig({
	description: 'View your linked profile and verification status',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	const profile = (await getProfileByDId(interaction.user.id)) as db_player | null
	const embed = new EmbedBuilder().setColor('Blue')

	if (!profile) {
		return {
			embeds: [
				embed
					.setTitle('❌ No profile found')
					.setDescription('You have not verified yet. Use `/verify mc` to get started.')
			],
			flags: ['Ephemeral']
		}
	}

	const member = await getMemberUserId(interaction.user.id)
	const maskedEmail = profile.uea_email ? `${profile.uea_email[0]}***@uea.ac.uk` : 'Not linked'

	embed
		.setTitle(`✦ ${interaction.user.displayName}'s Profile`)
		.addFields(
			{ name: 'MC Username', value: profile.mc_username ?? 'Not linked', inline: true },
			{ name: 'MC UUID', value: profile.mc_uuid ? `\`${profile.mc_uuid}\`` : 'Not linked', inline: true },
			{ name: 'UEA Email', value: maskedEmail, inline: true },
			{ name: 'Rank', value: profile.mc_rank, inline: true },
			{ name: 'Member', value: member ? '✅ Yes' : '❌ No', inline: true },
			{ name: 'Account Created', value: `${profile.created_at}`, inline: true }
		)

	return { embeds: [embed], flags: ['Ephemeral'] }
}
