import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, setState } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, db_warns, db_player } from '~/utill'

export const config = createCommandConfig({
	description: 'Open the warning creation flow for a user',
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
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	if (!interaction.guild) return

	const user = options.user
	if (!user) return { content: 'Invalid user', flags: ['Ephemeral'] }

	const profile = (await getProfileByDId(user.id)) as db_player | null

	const warn: db_warns = {
		warn_id: '',
		user_id: user.id,
		issuer: interaction.user.id,
		reason: '',
		img: [],
		effected_users: [],
		warn_effects_bans: true,
		created_at: ''
	}

	const embed = new EmbedBuilder()
		.setColor('Yellow')
		.setTitle(`⚠️ New Warning — ${user.displayName}${profile?.mc_username ? ` (${profile.mc_username})` : ''}`)
		.setDescription('Reason: \n\n*not set — click Edit Reason*')
		.addFields(
			{ name: 'Effected Users:', value: 'None', inline: false },
			{ name: "Should this Warning Count to the 3 Warning's Ban", value: 'true', inline: false },
			{ name: 'Supporting Image Links: ', value: 'None', inline: false }
		)

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`warn_btn_reason-${interaction.user.id}`)
			.setLabel('Edit Reason')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`warn_btn_effusr-${interaction.user.id}`)
			.setLabel('Effected Users')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`warn_btn_img-${interaction.user.id}`)
			.setLabel('Add Images')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`warn_btn_warn-${interaction.user.id}`)
			.setLabel("Don't Count to Ban")
			.setStyle(ButtonStyle.Secondary)
	)

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`warn_btn_confirm-${interaction.user.id}`)
			.setLabel('✅ Confirm Warning')
			.setStyle(ButtonStyle.Danger),
		new ButtonBuilder()
			.setCustomId(`warn_btn_cancel-${interaction.user.id}`)
			.setLabel('❌ Cancel')
			.setStyle(ButtonStyle.Secondary)
	)

	// Send as non-ephemeral so model-warn_create can fetch and edit the message
	await interaction.reply({ embeds: [embed], components: [row, row2] })

	const msg = await interaction.fetchReply()
	await setState<db_warns>(`warn_create_${interaction.user.id}`, warn)
	await setState(`warn_session_inprog-${interaction.user.id}`, true)
	await setState(`warn_msg-${interaction.user.id}`, `${msg.channelId}-${msg.id}`)
}
