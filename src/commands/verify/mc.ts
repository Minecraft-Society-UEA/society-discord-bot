import { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { createCommandConfig, Flashcore, logger } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { connected_players, return_command, tokens } from '../../utill/types'
import { generateCode, getTokens } from '../../utill/functions'

export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
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
	// sage: {ephemeral: true}
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const tokens = getTokens() as tokens
	const username = options['mc-username']
	const modal = new ModalBuilder().setCustomId('verifiy-mc-code').setTitle('Minecraft Verification Code')
	const embed = new EmbedBuilder()

	let data_hub

	const response_hub = await fetch(`${host}:${h_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.hub}`
		}
	})
	if (!response_hub.ok) {
		logger.error('Error getting hub players.')
	} else {
		data_hub = (await response_hub.json()) as connected_players
	}

	if (!data_hub) {
		return `hub server is down`
	}

	const player = data_hub.online_players.find((p) => p.name === username)

	embed.setColor('Red').setTitle(`No player with username: ${username} connected to Hub`)

	if (!player) return { embeds: [embed] }

	const code = generateCode()

	await Flashcore.set(`verify_code-${interaction.user.id}`, code)
	await Flashcore.set(`verify_code-mc_username-${interaction.user.id}`, player.name)
	await Flashcore.set(`verify_code-mc_uuid-${interaction.user.id}`, player.uuid)

	const body = {
		player: `${player.name}`,
		message: `[MC-UEA VERIFY] Code: ${code}`
	}

	const response = await fetch(`${host}:${h_port}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${tokens.hub}`
		},
		body: JSON.stringify(body)
	})

	if (response.status !== 200) {
		logger.error('Error sending player the code.')
	}

	const one = new TextInputBuilder()
		.setCustomId('mc-code')
		.setLabel('The code Verify Wispered to you')
		.setMaxLength(5)
		.setPlaceholder('Code eg: 12345')
		.setRequired(true)
		.setStyle(TextInputStyle.Short)

	const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(one)

	modal.addComponents(firstActionRow)

	await interaction.showModal(modal)
	return
}
