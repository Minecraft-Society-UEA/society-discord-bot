import { ActionRowBuilder, ButtonInteraction, Client, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'

export default async (interaction: ButtonInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isButton()) return

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `btn-${interaction.user.id}-open_email_code_model`) {
		const modal = new ModalBuilder()
			.setCustomId(`verifiy-email-code-${interaction.user.id}`)
			.setTitle('Email Verification Code')

		//creating the modal to show the suer on discord
		const one = new TextInputBuilder()
			.setCustomId(`email-code`)
			.setLabel('The code Verify Wispered to you')
			.setMaxLength(5)
			.setPlaceholder('Code eg: 12345')
			.setRequired(true)
			.setStyle(TextInputStyle.Short)

		const two = new TextInputBuilder()
			.setCustomId(`name`)
			.setLabel('Prefured Name')
			.setMaxLength(16)
			.setPlaceholder('Jerry...')
			.setRequired(true)
			.setStyle(TextInputStyle.Short)

		const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(one)
		const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(two)

		modal.addComponents(firstActionRow, secondActionRow)

		// showing the modal to the user
		await interaction.showModal(modal)
		return
	}
}
