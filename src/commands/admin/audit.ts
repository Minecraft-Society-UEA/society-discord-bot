import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, setState } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	getProfileByDId,
	getWarningsByUserId,
	getBansByUserId,
	db_warns,
	db_bans,
	dateAfterMinutes,
	db_player
} from '~/utill'

export const config = createCommandConfig({
	description: 'View warning and ban history for a user',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to audit',
			type: 'member',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

const makeRow = (type: 'warn' | 'ban', id: string, pos: number, max: number) =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`audit_${type}_btn_back-${id}`)
			.setEmoji('⬅️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(pos <= 0),
		new ButtonBuilder()
			.setCustomId(`audit_${type}_btn_mid-${id}`)
			.setEmoji('⏹️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder()
			.setCustomId(`audit_${type}_btn_next-${id}`)
			.setEmoji('➡️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(pos >= max - 1)
	)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guild) return

	const user = options.user
	if (!user) return

	const [profile, warnings, bans] = await Promise.all([
		getProfileByDId(user.id) as Promise<db_player | null>,
		getWarningsByUserId(user.id) as Promise<db_warns[]>,
		getBansByUserId(user.id) as Promise<db_bans[]>
	])

	await setState(`audit_warn-${user.id}`, warnings)
	await setState(`audit_warn_pos-${user.id}`, 0)
	await setState(`audit_bans-${user.id}`, bans)
	await setState(`audit_bans_pos-${user.id}`, 0)

	const headerEmbed = new EmbedBuilder()
		.setTitle(`📋 Audit: ${user.displayName}`)
		.setColor('Blue')
		.addFields(
			{ name: 'MC Username', value: profile?.mc_username ?? 'Not linked', inline: true },
			{ name: 'Warnings', value: `${warnings.length}`, inline: true },
			{ name: 'Bans', value: `${bans.length}`, inline: true }
		)

	await interaction.reply({ embeds: [headerEmbed], flags: ['Ephemeral'] })

	// Warn section — separate followUp so its buttons only control warn pagination
	if (warnings.length > 0) {
		const w = warnings[0]
		const warnEmbed = new EmbedBuilder()
			.setColor('Yellow')
			.setTitle('Warnings')
			.setDescription(`Reason:\n${w.reason}\n\nImage URL's:\n${w.img?.join(', ') ?? "No URL's"}`)
			.setFields(
				{
					name: 'Effected Users:',
					value:
						w.effected_users?.length
							? w.effected_users
									.map((id) => {
										const m = interaction.guild!.members.cache.get(id) as GuildMember
										return m?.displayName ?? id
									})
									.join(', ')
							: 'None'
				},
				{ name: 'Warning effect Bans:', value: `${w.warn_effects_bans}` }
			)
			.setFooter({ text: `[1/${warnings.length}] Created At: ${w.created_at}` })

		await interaction.followUp({ embeds: [warnEmbed], components: [makeRow('warn', user.id, 0, warnings.length)], flags: ['Ephemeral'] })
	} else {
		await interaction.followUp({ content: '✅ No warnings on record.', flags: ['Ephemeral'] })
	}

	// Ban section — separate followUp so its buttons only control ban pagination
	if (bans.length > 0) {
		const b = bans[0]
		const banEmbed = new EmbedBuilder()
			.setColor('Red')
			.setTitle('Bans')
			.setDescription(`Reason:\n${b.reason}`)
			.setFields(
				{ name: 'Banned For:', value: `${b.banned_till} Minutes`, inline: true },
				{ name: 'Ban Expires:', value: dateAfterMinutes(b.banned_till), inline: true }
			)
			.setFooter({ text: `[1/${bans.length}] Created At: ${b.created_at}` })

		await interaction.followUp({ embeds: [banEmbed], components: [makeRow('ban', user.id, 0, bans.length)], flags: ['Ephemeral'] })
	} else {
		await interaction.followUp({ content: '✅ No bans on record.', flags: ['Ephemeral'] })
	}

}

