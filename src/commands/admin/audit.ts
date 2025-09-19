import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, setState } from 'robo.js'
import type { ChatInputCommandInteraction, GuildBasedChannel, GuildMember } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_bans, db_player, db_warns, player, ServerKey } from '../../utill/types'
import { getBansByUserId, getProfileByDId, getWarningsByUserId } from '../../utill/database_functions'
import { dateAfterMinutes, getServerPlayer, online_server_check } from '../../utill/functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'user audit',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to warn',
			type: 'member',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
	sage: { ephemeral: true }
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guild) return
	// declaring variables we need
	const user = options.user
	const embed = new EmbedBuilder()
	const warnEmbed = new EmbedBuilder()
	const banEmbed = new EmbedBuilder()

	if (!user) return { content: `No user found` }

	const warnings = (await getWarningsByUserId(user.id)) as db_warns[]
	const bans = (await getBansByUserId(user.id)) as db_bans[]
	const profile = (await getProfileByDId(user.id)) as db_player

	setState(`audit_bans-${interaction.id}`, bans)
	setState(`audit_warn-${interaction.id}`, warnings)

	const online = (await online_server_check(profile.mc_username ?? ``)) as ServerKey
	if (online) {
		const onplayer = (await getServerPlayer(online, profile.mc_username ?? ``)) as player
		if (onplayer) {
			embed.addFields({
				name: `✦ Player is in ${online} 🟢`,
				value: `${onplayer.health} | level: ${onplayer.level}`
			})
		}
	} else {
		embed.addFields({
			name: `✦ Player is offline 🔴`,
			value: ``
		})
	}

	embed
		.setColor(`Blurple`)
		.setTitle(`Full Audit of ${user.displayName}`)
		.setDescription(
			`\nUEA Email: ${profile.uea_email ?? `unlinked`}\nMinecraft Username: ${profile.mc_username ?? `unlinked`} | UUID: ${profile.mc_uuid ?? `unlinked`}\npermition level: ${profile.mc_rank} | Paid Member: ${profile.is_member}\nUser First Linked at: ${profile.created_at}`
		)
		.setThumbnail(user.displayAvatarURL())

	const profilemessage = await interaction.reply({ embeds: [embed] })
	if (!interaction.channel) return `invalid channel`
	const channel = (await interaction.guild.channels.cache.get(interaction.channel.id)) as GuildBasedChannel

	if (!channel.isSendable() || !channel.isTextBased()) return `Either <#${channel.id}> (#${channel.name}) is not TextBased, or I do not have the required permissions to send messages there`

	if (warnings) {
		let warnmsgid
		warnEmbed
			.setColor(`Yellow`)
			.setTitle(`Warnings`)
			.setDescription(`Reason: \n${warnings[0].reason}\n\nImage URL's: \n${warnings[0].img?.join(`, `) ?? `No URL's`}`)
			.addFields(
				{
					name: `Effected Users: `,
					value: `${warnings[0].effected_users
						?.map((id: string) => {
							const user = interaction.guild?.members.cache.get(id) as GuildMember
							return user?.displayName ?? id
						})
						.join(', ')}`
				},
				{
					name: `Warning effect Bans: `,
					value: `${warnings[0].warn_effects_bans}`
				}
			)
			.setFooter({ text: `Created At: ${warnings[0].created_at}` })
		if (warnings.length > 1) {
			const btn_warn_back = new ButtonBuilder()
				.setCustomId(`audit_warn_btn_back-${interaction.id}`)
				.setEmoji(`⬅️`)
				.setStyle(ButtonStyle.Primary)
				.setDisabled(true)
			const btn_warn_null = new ButtonBuilder()
				.setCustomId(`audit_warn_btn_mid-${interaction.id}`)
				.setEmoji(`⏹️`)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true)
			const btn_warn_next = new ButtonBuilder()
				.setCustomId(`audit_warn_btn_next-${interaction.id}`)
				.setEmoji(`➡️`)
				.setStyle(ButtonStyle.Primary)

			const row0 = new ActionRowBuilder<ButtonBuilder>().addComponents(btn_warn_back, btn_warn_null, btn_warn_next)

			const warnmessage = await channel.send({ embeds: [warnEmbed], components: [row0] })
			warnmsgid = warnmessage.id
		} else {
			const warnmessage = await channel.send({ embeds: [warnEmbed] })
			warnmsgid = warnmessage.id
		}
		await setState(`audit_warn_msg-${interaction.id}`, warnmsgid)
	}

	if (bans) {
		let banmsgid
		banEmbed
			.setColor(`Red`)
			.setTitle(`Ban's`)
			.setDescription(`Reason: \n${bans[0].reason}`)
			.addFields(
				{
					name: `Banned For: `,
					value: `${bans[0].banned_till} Minutes`,
					inline: true
				},
				{
					name: `Ban Expires: `,
					value: `${dateAfterMinutes(bans[0].banned_till)}`,
					inline: true
				}
			)
			.setFooter({ text: `Created At: ${bans[0].created_at}` })
		if (bans.length > 1) {
			const btn_ban_back = new ButtonBuilder()
				.setCustomId(`audit_ban_btn_back-${interaction.id}`)
				.setEmoji(`⬅️`)
				.setStyle(ButtonStyle.Primary)
				.setDisabled(true)
			const btn_ban_null = new ButtonBuilder()
				.setCustomId(`audit_ban_btn_mid-${interaction.id}`)
				.setEmoji(`⏹️`)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true)
			const btn_ban_next = new ButtonBuilder()
				.setCustomId(`audit_ban_btn_next-${interaction.id}`)
				.setEmoji(`➡️`)
				.setStyle(ButtonStyle.Primary)

			const row0 = new ActionRowBuilder<ButtonBuilder>().addComponents(btn_ban_back, btn_ban_null, btn_ban_next)

			const banmessage = await channel.send({ embeds: [warnEmbed], components: [row0] })
			banmsgid = banmessage.id
		} else {
			const banmessage = await channel.send({ embeds: [warnEmbed] })
			banmsgid = banmessage.id
		}
		await setState(`audit_ban_msg-${interaction.id}`, banmsgid)
	}

	return
}
