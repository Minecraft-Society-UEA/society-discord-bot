import {
	ButtonInteraction,
	Client,
	EmbedBuilder,
	GuildMember,
	Message,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} from 'discord.js'
import { getState, setState } from 'robo.js'
import { dateAfterMinutes } from '../../utill/functions'
import { db_warns, db_bans } from '../../utill/types'

export default async (interaction: ButtonInteraction, client: Client) => {
	if (!interaction.isButton() || !interaction.guild || !interaction.channel) return
	const channel = interaction.guild.channels.cache.get(interaction.channel.id)
	if (!channel?.isSendable() || !channel.isTextBased()) return

	const makeRow = (type: 'warn' | 'ban', id: string, pos: number, max: number) => {
		const btn_back = new ButtonBuilder()
			.setCustomId(`audit_${type}_btn_back-${id}`)
			.setEmoji('⬅️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(pos <= 0)

		const btn_null = new ButtonBuilder()
			.setCustomId(`audit_${type}_btn_mid-${id}`)
			.setEmoji('⏹️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true)

		const btn_next = new ButtonBuilder()
			.setCustomId(`audit_${type}_btn_next-${id}`)
			.setEmoji('➡️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(pos >= max - 1)

		return new ActionRowBuilder<ButtonBuilder>().addComponents(btn_back, btn_null, btn_next)
	}

	const buildWarnEmbed = (warning: db_warns, guild: typeof interaction.guild) => {
		return new EmbedBuilder()
			.setColor('Yellow')
			.setTitle('Warnings')
			.setDescription(`Reason:\n${warning.reason}\n\nImage URL's:\n${warning.img?.join(', ') ?? "No URL's"}`)
			.setFields(
				{
					name: 'Effected Users:',
					value:
						warning.effected_users
							?.map((id: string) => {
								const user = guild.members.cache.get(id) as GuildMember
								return user?.displayName ?? id
							})
							.join(', ') || 'None'
				},
				{
					name: 'Warning effect Bans:',
					value: `${warning.warn_effects_bans}`
				}
			)
			.setFooter({ text: `Created At: ${warning.created_at}` })
	}

	const buildBanEmbed = (ban: db_bans) => {
		return new EmbedBuilder()
			.setColor('Red')
			.setTitle('Bans')
			.setDescription(`Reason:\n${ban.reason}`)
			.setFields(
				{
					name: `Banned For: `,
					value: `${ban.banned_till} Minutes`,
					inline: true
				},
				{
					name: `Ban Expires: `,
					value: `${dateAfterMinutes(ban.banned_till)}`,
					inline: true
				}
			)
			.setFooter({ text: `Created At: ${ban.created_at}` })
	}

	// WARN BACK
	if (interaction.customId.startsWith('audit_warn_btn_back-')) {
		const realId = interaction.customId.replace('audit_warn_btn_back-', '')
		const messageid = (await getState(`audit_warn_msg-${realId}`)) as string
		const warnings = (await getState(`audit_warn-${realId}`)) as db_warns[]
		let current_pos = (await getState(`audit_warn_pos-${realId}`)) as number

		current_pos = Math.max(0, current_pos - 1)
		await setState(`audit_warn_pos-${realId}`, current_pos)

		const warning = warnings[current_pos]
		const message = (await channel.messages.fetch(messageid)) as Message

		const embed = buildWarnEmbed(warning, interaction.guild)
		const row = makeRow('warn', realId, current_pos, warnings.length)

		return interaction.update({ embeds: [embed], components: [row] })
	}

	// WARN NEXT
	if (interaction.customId.startsWith('audit_warn_btn_next-')) {
		const realId = interaction.customId.replace('audit_warn_btn_next-', '')
		const messageid = (await getState(`audit_warn_msg-${realId}`)) as string
		const warnings = (await getState(`audit_warn-${realId}`)) as db_warns[]
		let current_pos = (await getState(`audit_warn_pos-${realId}`)) as number

		current_pos = Math.min(warnings.length - 1, current_pos + 1)
		await setState(`audit_warn_pos-${realId}`, current_pos)

		const warning = warnings[current_pos]
		const message = (await channel.messages.fetch(messageid)) as Message

		const embed = buildWarnEmbed(warning, interaction.guild)
		const row = makeRow('warn', realId, current_pos, warnings.length)

		return interaction.update({ embeds: [embed], components: [row] })
	}

	// BAN BACK
	if (interaction.customId.startsWith('audit_ban_btn_back-')) {
		const realId = interaction.customId.replace('audit_ban_btn_back-', '')
		const messageid = (await getState(`audit_ban_msg-${realId}`)) as string
		const bans = (await getState(`audit_bans-${realId}`)) as db_bans[]
		let current_pos = (await getState(`audit_bans_pos-${realId}`)) as number

		current_pos = Math.max(0, current_pos - 1)
		await setState(`audit_bans_pos-${realId}`, current_pos)

		const ban = bans[current_pos]
		const message = (await channel.messages.fetch(messageid)) as Message

		const embed = buildBanEmbed(ban)
		const row = makeRow('ban', realId, current_pos, bans.length)

		return interaction.update({ embeds: [embed], components: [row] })
	}

	// BAN NEXT
	if (interaction.customId.startsWith('audit_ban_btn_next-')) {
		const realId = interaction.customId.replace('audit_ban_btn_next-', '')
		const messageid = (await getState(`audit_ban_msg-${realId}`)) as string
		const bans = (await getState(`audit_bans-${realId}`)) as db_bans[]
		let current_pos = (await getState(`audit_bans_pos-${realId}`)) as number

		current_pos = Math.min(bans.length - 1, current_pos + 1)
		await setState(`audit_bans_pos-${realId}`, current_pos)

		const ban = bans[current_pos]
		const message = (await channel.messages.fetch(messageid)) as Message

		const embed = buildBanEmbed(ban)
		const row = makeRow('ban', realId, current_pos, bans.length)

		return interaction.update({ embeds: [embed], components: [row] })
	}
}
