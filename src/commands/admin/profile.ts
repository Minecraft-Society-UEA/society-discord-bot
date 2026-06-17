import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, getMemberUserId, db_player } from '~/utill'

export const config = createCommandConfig({
	description: "View another user's linked profile and verification status",
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to view the profile of',
			type: 'member',
			required: true
		},
		{
			name: 'ephemeral',
			description: 'whether the reply should only be visible to you (default: true)',
			type: 'boolean',
			required: false
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const user = options.user
	if (!user) return

	const ephemeral = options.ephemeral ?? true

	const profile = (await getProfileByDId(user.id)) as db_player | null
	const embed = new EmbedBuilder().setColor('Blue')

	if (!profile) {
		return {
			embeds: [
				embed
					.setTitle('❌ No profile found')
					.setDescription(`${user.displayName} has not verified yet.`)
			],
			flags: ephemeral ? ['Ephemeral'] : undefined
		}
	}

	const member = await getMemberUserId(user.id)
	const maskedEmail = profile.uea_email ? `${profile.uea_email[0]}***@uea.ac.uk` : 'Not linked'

	embed
		.setTitle(`✦ ${user.displayName}'s Profile`)
		.addFields(
			{ name: 'MC Username', value: profile.mc_username ?? 'Not linked', inline: true },
			{ name: 'MC UUID', value: profile.mc_uuid ? `\`${profile.mc_uuid}\`` : 'Not linked', inline: true },
			{ name: 'UEA Email', value: maskedEmail, inline: true },
			{ name: 'Rank', value: profile.mc_rank, inline: true },
			{ name: 'Member', value: member ? '✅ Yes' : '❌ No', inline: true },
			{ name: 'Account Created', value: `${profile.created_at}`, inline: true }
		)

	return { embeds: [embed], flags: ephemeral ? ['Ephemeral'] : undefined }
}
