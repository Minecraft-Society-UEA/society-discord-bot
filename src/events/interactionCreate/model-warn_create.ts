import { ModalSubmitInteraction, Client, EmbedBuilder } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import { getTokens } from '../../utill/functions'
import { db_player, tokens } from '../../utill/types'
import { createPlayerProfile, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit()) return

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `warn_model_reason-${interaction.user.id}`) {
		const code = interaction.fields.getTextInputValue('reason') as string
	}

	return
}
