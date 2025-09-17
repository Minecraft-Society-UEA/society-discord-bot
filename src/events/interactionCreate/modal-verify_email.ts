import { ModalSubmitInteraction, Client, EmbedBuilder } from 'discord.js'
import { Flashcore } from 'robo.js'
import { db_player } from '../../utill/types'
import { getProfileByDId, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit()) return

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `verifiy-mc-code-${interaction.user.id}`) {
		// get the original code and the one the player inputed
		const code = interaction.fields.getTextInputValue('mc-code') as string
		const user_code = (await Flashcore.get(`verify_email-code-${interaction.user.id}`)) as string

		// compare if they match
		if (code === user_code) {
			// declaring variables we need
			const email = (await Flashcore.get(`verify_email-email-${interaction.user.id}`)) as string
			const embed = new EmbedBuilder()

			// create a player profile in the database
			const playerProfile = (await getProfileByDId(interaction.user.id)) as db_player

			// add the players data
			playerProfile.uea_email === email

			// update the players profile with the new data
			await updatePlayerProfile(interaction.user.id, playerProfile)

			await interaction.reply({
				embeds: [embed.setTitle(`Successfully Verified UEA Email`).setColor('Green')],
				ephemeral: true
			})
			return
		}
	}

	return
}
