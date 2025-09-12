import { ModalSubmitInteraction, Client, EmbedBuilder, GuildMember } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import { getTokens } from '../../utill/functions'
import { db_player, tokens } from '../../utill/types'
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
			const host = process.env.MC_HOST
			const h_port = process.env.HUB_PORT
			const tokens = getTokens() as tokens
			const username = (await Flashcore.get(`verify_code-mc_username-${interaction.user.id}`)) as string
			const uuid = (await Flashcore.get(`verify_code-mc_uuid-${interaction.user.id}`)) as string
			const embed = new EmbedBuilder()
			const member = interaction.member as GuildMember

			// create bodys for adding the in game permition and messaging them success
			const body_command = {
				command: `lp user ${username} promote player`
			}

			const body_message = {
				player: username,
				message: `[MC-UEA VERIFY] Successfully Verified`
			}

			// add the players permitions
			const response = await fetch(`${host}:${h_port}/api/server/command`, {
				method: 'post',
				headers: {
					Authorization: `Bearer ${tokens.hub}`
				},
				body: JSON.stringify(body_command)
			})

			// if adding permition failed dont proceed and send a message
			if (response.status !== 200) {
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
			const response2 = await fetch(`${host}:${h_port}/api/player/message`, {
				method: 'post',
				headers: {
					Authorization: `Bearer ${tokens.hub}`
				},
				body: JSON.stringify(body_message)
			})

			// set player nickname in disocrds
			await member.setNickname(`${member.displayName} ✧ ${username}`)

			await interaction.reply({ embeds: [embed.setTitle(`Successfully Verified`).setColor('Green')], ephemeral: true })
			return
		}
	}

	return
}
