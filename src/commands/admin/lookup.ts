import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	getProfileByDId,
	getProfileByMcUsername,
	getProfileByUeaEmail,
	getMemberUserId,
	db_player,
	log
} from '~/utill'

export const config = createCommandConfig({
	description: 'Find a player profile by Discord user, MC username, or UEA email prefix',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'look up by Discord user',
			type: 'member',
			required: false
		},
		{
			name: 'mc_username',
			description: 'look up by Minecraft username',
			type: 'string',
			required: false
		},
		{
			name: 'email',
			description: 'look up by UEA email prefix (e.g. abc12345)',
			type: 'string',
			required: false
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const { user, mc_username, email } = options

	if (!user && !mc_username && !email) {
		return { content: 'Provide at least one of: `user`, `mc_username`, or `email`.', flags: ['Ephemeral'] }
	}

	let profile: db_player | null = null

	try {
		if (user) {
			profile = (await getProfileByDId(user.id)) as db_player | null
		} else if (mc_username) {
			profile = (await getProfileByMcUsername(mc_username)) as db_player | null
		} else if (email) {
			profile = (await getProfileByUeaEmail(email)) as db_player | null
		}
	} catch (err) {
		log.error(`Admin lookup error: ${err}`)
		return { content: '❌ Database error during lookup.', flags: ['Ephemeral'] }
	}

	if (!profile) {
		return {
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ No player found').setDescription('No profile matched the provided query.')],
			flags: ['Ephemeral']
		}
	}

	const member = await getMemberUserId(profile.user_id)
	const discordMember = await interaction.guild?.members.fetch(profile.user_id).catch(() => null)

	const embed = new EmbedBuilder()
		.setTitle(`🔍 Player Lookup`)
		.setColor('Blue')
		.addFields(
			{ name: 'Discord', value: discordMember ? `${discordMember} (${discordMember.displayName})` : `<@${profile.user_id}>`, inline: false },
			{ name: 'MC Username', value: profile.mc_username ?? 'Not linked', inline: true },
			{ name: 'MC UUID', value: profile.mc_uuid ? `\`${profile.mc_uuid}\`` : 'Not linked', inline: true },
			{ name: 'UEA Email', value: profile.uea_email ? `\`${profile.uea_email}@uea.ac.uk\`` : 'Not linked', inline: true },
			{ name: 'Rank', value: profile.mc_rank, inline: true },
			{ name: 'Member', value: member ? '✅ Yes' : '❌ No', inline: true },
			{ name: 'Joined', value: `${profile.created_at}`, inline: true }
		)

	return { embeds: [embed], flags: ['Ephemeral'] }
}
