import { ModalSubmitInteraction, Client } from 'discord.js'
import { updateSettings } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild || !interaction.guild.members.me)
		return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId.startsWith(`update_setting-${interaction.user.id}`)) {
		await interaction.deferReply({ flags: 'Ephemeral' })
		const setting = interaction.customId.split(`-`)[2]
		const new_setting = interaction.fields.getTextInputValue('settings') as string

		await updateSettings(setting, JSON.parse(new_setting))

		interaction.editReply({ content: `UPDATED ${setting} with: \n\n${new_setting}` })
	}
}
