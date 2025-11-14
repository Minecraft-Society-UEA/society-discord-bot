import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js'
import { CommandResult, createCommandConfig } from 'robo.js'
import { getSettingByid, modmailSettings } from '~/utill'

export const config = createCommandConfig({
	description: 'Customise the Title and Footer of mod DMs',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	if (interaction.guild === null) return
	const modal = new ModalBuilder()
		.setCustomId('modmail_modal_chatting')
		.setTitle(`Customise the title, desription and footer`)
	const setting = (await getSettingByid(`modmail`)) as modmailSettings

	const one = new TextInputBuilder()
		.setCustomId('title')
		.setLabel('The Title')
		.setMaxLength(100)
		.setPlaceholder('Title of the embed that get sent')
		.setValue(setting.setting.customMsg.title ?? ``)
		.setRequired(true)
		.setStyle(TextInputStyle.Short)

	const two = new TextInputBuilder()
		.setCustomId('footer')
		.setLabel('The Footer')
		.setMaxLength(100)
		.setPlaceholder('footer of embeds that get sent')
		.setValue(setting.setting.customMsg.footer ?? ``)
		.setRequired(true)
		.setStyle(TextInputStyle.Short)

	const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(one)
	const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(two)

	modal.addComponents(firstActionRow, secondActionRow)
	await interaction.showModal(modal)
}
