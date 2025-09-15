import { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { createCommandConfig, Flashcore, logger } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import type { connected_players, tokens } from '../../utill/types'
import { generateCode, getTokens } from '../../utill/functions'
import { getProfileByDId, getProfileByMcUsername } from '../../utill/database_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
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
	// sage: {ephemeral: true}		// commentted out for now maybe enable later
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	// options is the command options we set above
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const tokens = getTokens() as tokens
	const username = options['mc-username']
	const modal = new ModalBuilder()
		.setCustomId(`verifiy-mc-code-${interaction.user.id}`)
		.setTitle('Minecraft Verification Code')
	const embed = new EmbedBuilder()
	const already_verified = await getProfileByDId(interaction.user.id)
	const username_inuse = await getProfileByMcUsername(username)
	let data_hub

	// checking if the user already has verifide
	if (!already_verified) return { embeds: [embed.setTitle(`already verified on minecraft`)] }

	//checking if username is already linked
	if (!username_inuse)
		return {
			embeds: [
				embed.setTitle(
					`username is already verifide under a diffrent user if this is your account contact a member of the committee`
				)
			]
		}

	// pulls the player list from the Hub server
	const response_hub = await fetch(`${host}:${h_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.hub}`
		}
	})
	// checks if the response is ok and if it is sets the player list to data_hub
	if (!response_hub.ok) {
		logger.error('Error getting hub players.')
	} else {
		data_hub = (await response_hub.json()) as connected_players
	}

	// checks if data is valid
	if (!data_hub) {
		return `hub server is down`
	}

	//  checks if player is online in the hub server
	const player = data_hub.online_players.find((p) => p.name === username)

	// if the username isnt found in the player list tells them
	if (!player)
		return { embeds: [embed.setColor('Red').setTitle(`No player with username: ${username} connected to Hub`)] }

	// generate's a code to send to the player
	const code = generateCode()

	// store the username, uuid and code under the users discord id
	await Flashcore.set(`verify_code-${interaction.user.id}`, code)
	await Flashcore.set(`verify_code-mc_username-${interaction.user.id}`, player.name)
	await Flashcore.set(`verify_code-mc_uuid-${interaction.user.id}`, player.uuid)

	// create the message body to send the code to the player
	const body = {
		player: `${player.name}`,
		message: `[MC-UEA VERIFY] Code: ${code}`
	}

	// send the player a message in the server with the code
	const response = await fetch(`${host}:${h_port}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${tokens.hub}`
		},
		body: JSON.stringify(body)
	})

	// checks the message was sent correctly
	if (response.status !== 200) {
		logger.error('Error sending player the code.')
		return { embeds: [embed.setColor('Red').setTitle(`Failed sending the code`)] }
	}

	//creating the modal to show the suer on discord
	const one = new TextInputBuilder()
		.setCustomId(`mc-code`)
		.setLabel('The code Verify Wispered to you')
		.setMaxLength(5)
		.setPlaceholder('Code eg: 12345')
		.setRequired(true)
		.setStyle(TextInputStyle.Short)

	const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(one)

	modal.addComponents(firstActionRow)

	// showing the modal to the user
	await interaction.showModal(modal)
	return
}
