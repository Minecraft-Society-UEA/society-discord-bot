import {
	ActionRowBuilder,
	EmbedBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	PermissionsBitField,
	TextInputBuilder,
	TextInputStyle,
	type ChatInputCommandInteraction
} from 'discord.js'
import { createCommandConfig, Flashcore, logger } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import type { connected_players, db_player, setting_return, welcome_settings } from '../../utill/types'
import { generateCode, server_token_resolver } from '../../utill/functions'
import { getProfileByDId, getProfileByMcUsername, getServerByID, getSettingByid } from '../../utill/database_functions'

export const config = createCommandConfig({
	description: 'verify and link your mc to the discord allowing you to join',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'setting',
			description: 'mc username exactly how it is in the player list',
			type: 'string',
			required: true,
			choices: [
				{
					name: `welcome Settings`,
					value: `welcome_message`
				}
			]
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const setting = options.setting

	let old_setting = (await getSettingByid(setting)) as setting_return

	// build modal
	const Input = new TextInputBuilder()
		.setCustomId('settings')
		.setLabel('Input the code whispered to you in-game')
		.setPlaceholder('e.g: setings json')
		.setRequired(true)
		.setValue(JSON.stringify(old_setting.setting))
		.setStyle(TextInputStyle.Paragraph)

	const modal = new ModalBuilder()
		.setCustomId(`update_setting-${interaction.user.id}-${setting}`)
		.setTitle(`update ${setting}`)
		.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(Input))
	// show modal (first and only response here)

	await interaction.showModal(modal)
}
