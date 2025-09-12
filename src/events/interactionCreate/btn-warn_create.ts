import {
	ActionRowBuilder,
	ButtonInteraction,
	Client,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js'
import { getState } from 'robo.js'

export default async (interaction: ButtonInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isButton()) return

	const alr = (await getState<boolean>(`warn_session_inprog-${interaction.user.id}`)) ?? false
	const embed = new EmbedBuilder()

	if (!alr) {
		interaction.reply({ embeds: [embed.setColor(`Red`).setTitle(`this can only be used if you opened the warning`)] })
		return
	}

	// Im not commenting every button so ill do this one the rest mostly work the same
	// check the modal being submitted matches the custom id
	// edit reason button
	if (interaction.customId === `warn_btn_reason-${interaction.user.id}`) {
		const modal = new ModalBuilder()
			.setCustomId(`warn_model_reason-${interaction.user.id}`)
			.setTitle('Add/Edit the Reason for the warning')

		//creating the modal to show the user on discord
		const one = new TextInputBuilder()
			.setCustomId(`reason`)
			.setLabel('The Reason for the warning')
			.setMaxLength(1000)
			.setPlaceholder('Reason...')
			.setRequired(true)
			.setStyle(TextInputStyle.Paragraph)

		const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(one)

		modal.addComponents(firstActionRow)

		// showing the modal to the user
		await interaction.showModal(modal)
		return
	}

	// this one will prompt another command to add effected users
	if (interaction.customId === `warn_btn_effusr-${interaction.user.id}`) {
		const embed = EmbedBuilder.from(interaction.message.embeds[0]) // clone old embed

		// modify embed fields
		embed.spliceFields(0, 1, {
			name: 'Effected Users:',
			value: `Adding...` // example, replace with your list logic
		})

		// update the original message
		await interaction.update({
			embeds: [embed]
		})
		return
	}

	// this one will prompt another command to add up tp 3 images
	if (interaction.customId === `warn_btn_img-${interaction.user.id}`) {
		await interaction
		return
	}

	// this one will just set it
	if (interaction.customId === `warn_btn_warn-${interaction.user.id}`) {
		return
	}
}
