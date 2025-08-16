import { ModalSubmitInteraction, Client, EmbedBuilder } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import { getTokens } from '../../utill/functions'
import { db_player, tokens } from '../../utill/types'
import { createPlayerProfile, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	if (!interaction.isModalSubmit()) return

	if (interaction.customId === 'verifiy-mc-code') {
		const code = interaction.fields.getTextInputValue('mc-code') as string
		const user_code = (await Flashcore.get(`verify_code-${interaction.user.id}`)) as string

		if (code === user_code) {
			const host = process.env.MC_HOST
			const h_port = process.env.HUB_PORT
			const tokens = getTokens() as tokens
			const username = (await Flashcore.get(`verify_code-mc_username-${interaction.user.id}`)) as string
			const uuid = (await Flashcore.get(`verify_code-mc_uuid-${interaction.user.id}`)) as string
			const embed = new EmbedBuilder()

			const body_command = {
				command: `lp user ${username} promote player`
			}

			const body_message = {
				player: username,
				message: `[MC-UEA VERIFY] Successfully Verified`
			}

			const response = await fetch(`${host}:${h_port}/api/server/command`, {
				method: 'post',
				headers: {
					Authorization: `Bearer ${tokens.hub}`
				},
				body: JSON.stringify(body_command)
			})

			const playerProfile = (await createPlayerProfile(interaction.user.id)) as db_player

			playerProfile.mc_rank = `verified`
			playerProfile.mc_username = username
			playerProfile.mc_uuid = uuid
			playerProfile.mc_verifid = true

			await updatePlayerProfile(interaction.user.id, playerProfile)

			if (!response.ok) {
				logger.error('Error running command in hub.')
			}

			const response2 = await fetch(`${host}:${h_port}/api/player/message`, {
				method: 'post',
				headers: {
					Authorization: `Bearer ${tokens.hub}`
				},
				body: JSON.stringify(body_message)
			})

			embed.setTitle(`Successfully Verified`).setColor('Green')

			await interaction.reply({ embeds: [embed] })
			return
		}
	}

	return
}
