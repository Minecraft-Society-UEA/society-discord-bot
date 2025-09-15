import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { client, createCommandConfig, getState, logger, setState } from 'robo.js'
import type { ChatInputCommandInteraction, TextChannel } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_warns } from '~/utill/types'
import { isStringOneByteRepresentation } from 'v8'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
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

// reason, img, effected_users, warn_effects_bans

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guildId) return
	// declaring variables we need
	const user = options.user
	const alr = getState<boolean>(`warn_session_inprog-${interaction.user.id}`) ?? false
	const embed = new EmbedBuilder()
	const warn = {} as db_warns

	if (!user) return { content: `user you selected is invalid` }

	warn.user_id = user.id
	warn.warn_effects_bans = true

	// check if the admin has already started a warning
	if (alr)
		return { embeds: [embed.setColor(`Red`).setTitle(`you already have a open warning creator finish there first`)] }

	setState<boolean>(`warn_session_inprog-${interaction.user.id}`, true)
	setState<db_warns>(`warn_create_${interaction.user.id}`, warn)

	// make buttons for editing the warning
	const btn_reason = new ButtonBuilder()
		.setCustomId(`warn_btn_reason-${interaction.user.id}`)
		.setLabel(`Add Reason`)
		.setStyle(ButtonStyle.Primary)
	const btn_effusr = new ButtonBuilder()
		.setCustomId(`warn_btn_effusr-${interaction.user.id}`)
		.setLabel(`Add Effected Users`)
		.setStyle(ButtonStyle.Primary)
	const btn_img = new ButtonBuilder()
		.setCustomId(`warn_btn_img-${interaction.user.id}`)
		.setLabel(`Add Image`)
		.setStyle(ButtonStyle.Primary)

	const btn_warn = new ButtonBuilder()
		.setCustomId(`warn_btn_warn-${interaction.user.id}`)
		.setLabel(`Warning add to bans counter`)
		.setStyle(ButtonStyle.Primary)

	const btn_confirm = new ButtonBuilder()
		.setCustomId(`warn_btn_confirm-${interaction.user.id}`)
		.setLabel(`Confirm`)
		.setStyle(ButtonStyle.Success)
	const btn_cancel = new ButtonBuilder()
		.setCustomId(`warn_btn_cancel-${interaction.user.id}`)
		.setLabel(`Cancel`)
		.setStyle(ButtonStyle.Danger)

	// create embed
	embed
		.setColor(`Yellow`)
		.setTitle(`Creating Warning for ${user.displayName}`)
		.setDescription(`Reason: \nAdd Reason`)
		.setThumbnail(user.displayAvatarURL())
		.addFields(
			{
				name: `Effected Users: `,
				value: ``
			},
			{
				name: `Should this Warning Count to the 3 Warning's Ban`,
				value: `yes`
			},
			{
				name: `Supporting Image Links: `,
				value: ``
			}
		)
		.setFooter({ text: `Redo any button or command to edit the option` })
		.setTimestamp()

	// assemble the action rows
	const row0 = new ActionRowBuilder<ButtonBuilder>().addComponents(btn_reason, btn_effusr, btn_img, btn_warn)
	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(btn_confirm, btn_cancel)

	// send the message
	const message = await interaction.reply({ embeds: [embed], components: [row0, row1], fetchReply: true })

	setState<string>(`warn_msg-${interaction.user.id}`, `${interaction.channelId}-${message.id}`)

	return
}
