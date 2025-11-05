import {
	ActionRowBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
	TextInputStyle,
	type ChatInputCommandInteraction
} from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'

export const config = createCommandConfig({
	description: 'verify and link your mc to the discord allowing you to join',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const Input = new TextInputBuilder()
		.setCustomId('settings')
		.setLabel('HTML')
		.setPlaceholder('...')
		.setRequired(true)
		.setStyle(TextInputStyle.Paragraph)

	const modal = new ModalBuilder()
		.setCustomId(`update_members-${interaction.user.id}`)
		.setTitle(`update members with HTML`)
		.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(Input))
	// show modal (first and only response here)

	await interaction.showModal(modal)
}
