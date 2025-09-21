import { ModalSubmitInteraction, Client, EmbedBuilder } from 'discord.js'
import { Flashcore } from 'robo.js'
import { mc_command, message_player } from '../../utill/functions'
import { db_player } from '../../utill/types'
import { getProfileByDId, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild || !interaction.guild.members.me)
		return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `bed_mc-code-${interaction.user.id}`) {
		// get the original code and the one the player inputed
		const code = interaction.fields.getTextInputValue('mc-code') as string
		const user_code = (await Flashcore.get(`verify_bed_code-${interaction.user.id}`)) as string
		const embed = new EmbedBuilder()

		// compare if they match
		if (code === user_code) {
			// declaring variables we need
			const username = (await Flashcore.get(`verify_code-bed_mc_username-${interaction.user.id}`)) as string

			// add the players permitions
			await mc_command(`hub`, `lp user ${username} promote player`)

			// create a player profile in the database
			const playerProfile = (await getProfileByDId(interaction.user.id)) as db_player

			// add the players data
			playerProfile.bed_mc_username = username

			// update the players profile with the new data
			await updatePlayerProfile(interaction.user.id, playerProfile)

			// send the player a sucsess message
			await message_player(username, `UEAMCSOC VERIFY ✦ Successfully Verified`)

			return { embeds: [embed.setTitle(`✦ Successfully Verified Bedrock Account`).setColor('Green')] }
		} else {
			return { embeds: [embed.setTitle(`Code does not match, please try again`).setColor(`Red`)] }
		}
	}
}
