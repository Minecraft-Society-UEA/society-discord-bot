import {
	ActionRowBuilder,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ChatInputCommandInteraction
} from 'discord.js'
import { createCommandConfig, Flashcore, logger } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import type { connected_players, db_player } from '../../utill/types'
import { generateCode, server_token_resolver } from '../../utill/functions'
import { getProfileByDId, getProfileByMcUsername, getServerByID } from '../../utill/database_functions'

export const config = createCommandConfig({
	description: 'verify and link your mc to the discord allowing you to join',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'mc-username',
			description: 'mc username exactly how it is in the player list',
			type: 'string',
			required: true
		}
	]
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const server = await getServerByID(`a406fbb6-418d-4160-8611-1c180d33da14`)
	if (!server) return `db server = null`
	const username = options['mc-username']
	const embed = new EmbedBuilder()

	// fetch db profiles
	const already_verified = (await getProfileByMcUsername(username)) as db_player | null
	const username_inuse = (await getProfileByDId(interaction.user.id)) as db_player | null

	if (!already_verified && !username_inuse) {
		// pull hub players
		let data_hub: connected_players | null = null
		try {
			const response_hub = await fetch(`${server.host}:${server.port}/api/players`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${server_token_resolver(server.id)}` }
			})

			if (response_hub.ok) {
				data_hub = (await response_hub.json()) as connected_players
			} else {
				logger.error('Error getting hub players.')
			}
		} catch (err) {
			logger.error(`Hub fetch error: ${err}`)
			return {
				embeds: [embed.setColor('Red').setTitle('Error in fetch request')]
			}
		}

		if (!data_hub) {
			console.log(`hub is down`)
			return {
				embeds: [embed.setColor('Red').setTitle('Hub is Down')]
			}
		}
		// find player in hub
		const player = data_hub.online_players.find((p) => p.name === username)
		if (!player) {
			console.log(`Player "${username}" is not connected to the Hub`)
			return {
				embeds: [embed.setColor('Yellow').setTitle(`Player "${username}" is not connected to the Hub`)]
			}
		}
		// generate code + store
		const code = generateCode()
		await Flashcore.set(`verify_code-${interaction.user.id}`, code)
		await Flashcore.set(`verify_code-mc_username-${interaction.user.id}`, player.name)
		await Flashcore.set(`verify_code-mc_uuid-${interaction.user.id}`, player.uuid)

		// send code in-game
		const body = { player: player.name, message: `UEAMCSOC VERIFY ✦ Code: ${code}` }
		const response = await fetch(`${server.host}:${server.port}/api/player/message`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${server_token_resolver(server.id)}` },
			body: JSON.stringify(body)
		})

		if (response.status !== 200) {
			logger.error('Error sending player the code.')
		}

		// build modal
		const codeInput = new TextInputBuilder()
			.setCustomId('mc-code')
			.setLabel('Input the code whispered to you in-game')
			.setMaxLength(5)
			.setPlaceholder('e.g: AB123')
			.setRequired(true)
			.setStyle(TextInputStyle.Short)

		const modal = new ModalBuilder()
			.setCustomId(`mc-code-${interaction.user.id}`)
			.setTitle('Minecraft Verification Code')
			.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput))
		// show modal (first and only response here)

		await interaction.showModal(modal)
	} else if (already_verified?.mc_username || username_inuse) {
		return {
			embeds: [
				embed
					.setColor('Yellow')
					.setTitle('✦ You have already successfully verified on Minecraft or that username is in use.')
			]
		}
	}
}
