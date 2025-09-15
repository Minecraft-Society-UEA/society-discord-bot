import { ModalSubmitInteraction, Client, EmbedBuilder, GuildMember } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import { mc_command, message_player } from '../../utill/functions'
import { db_player, role_storage } from '../../utill/types'
import { createPlayerProfile, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit()) return

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `verifiy-mc-code-${interaction.user.id}`) {
		// get the original code and the one the player inputed
		const code = interaction.fields.getTextInputValue('mc-code') as string
		const user_code = (await Flashcore.get(`verify_code-${interaction.user.id}`)) as string

		// compare if they match
		if (code === user_code) {
			// declaring variables we need
			const username = (await Flashcore.get(`verify_code-mc_username-${interaction.user.id}`)) as string
			const uuid = (await Flashcore.get(`verify_code-mc_uuid-${interaction.user.id}`)) as string
			const embed = new EmbedBuilder()
			const member = interaction.member as GuildMember
			const roles = Flashcore.get(`mc_role_id`) as role_storage

			await member.roles.add(roles.mc_verified)

			// add the players permitions
			const response = await mc_command(`hub`, `lp user ${username} promote player`)

			// if adding permition failed dont proceed and send a message
			if (!response) {
				logger.error('Error running command in hub.')
				return interaction.reply({
					embeds: [embed.setColor('Red').setTitle(`Failed to add user permitions on the servers`)]
				})
			}

			// create a player profile in the database
			const playerProfile = (await createPlayerProfile(interaction.user.id)) as db_player

			// add the players data
			playerProfile.mc_rank = `verified`
			playerProfile.mc_username = username
			playerProfile.mc_uuid = uuid
			playerProfile.mc_verifid = true

			// update the players profile with the new data
			await updatePlayerProfile(interaction.user.id, playerProfile)

			// send the player a sucsess message
			await message_player(username, `[MC-UEA VERIFY] Successfully Verified`)

			// set player nickname in disocrds
			await member.setNickname(`${member.displayName} ✧ ${username}`)

			await interaction.reply({ embeds: [embed.setTitle(`Successfully Verified`).setColor('Green')], ephemeral: true })
			return
		}
	}

	return
}
