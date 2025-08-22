import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, logger } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import type { all_player_list, tokens } from '../../utill/types'
import { getPlayerListAllServers, getTokens } from '../../utill/functions'
import { getProfileByDId } from '../../utill/database_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'a user that is linked and playing on the server',
			type: 'member',
			required: true
		},
		{
			name: 'message',
			description: 'message to send to player',
			type: 'string',
			required: true
		}
	],
	sage: { ephemeral: true },
	defaultMemberPermissions: PermissionFlagsBits.SendMessages
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	// options is the command options we set above
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const embed = new EmbedBuilder()
	const target = options.user
	const msg = options.message
	const host = process.env.MC_HOST
	const tokens = getTokens() as tokens

	let port
	let server_token

	const profile = await getProfileByDId(target.user.id)

	if (profile === `error` || !profile.mc_username)
		return {
			embeds: [
				embed.setColor('Red').setTitle(`User ${target.displayName} is not linked and therefore cant be messaged`)
			]
		}

	// get all players make sure there online and set the port and server token
	const all_players = (await getPlayerListAllServers()) as all_player_list

	if (all_players.hub.online_players.find((p) => p.name === profile.mc_username)) {
		server_token = tokens.hub
		port = process.env.HUB_PORT
	} else if (all_players.survival.online_players.find((p) => p.name === profile.mc_username)) {
		server_token = tokens.survival
		port = process.env.SURVIVAL_PORT
	} else if (all_players.creative.online_players.find((p) => p.name === profile.mc_username)) {
		server_token = tokens.creative
		port = process.env.CREATIVE_PORT
	} else if (all_players.event.online_players.find((p) => p.name === profile.mc_username)) {
		server_token = tokens.event
		port = process.env.EVENT_PORT
	} else
		return {
			embeds: [
				embed
					.setColor('Red')
					.setTitle(
						`user ${target.user.displayName}'s minecraft account ${profile.mc_username} cannot be found on the server`
					)
			]
		}

	// create the message body to send the code to the player
	const body = {
		player: `${profile.mc_username}`,
		message: `[DISCORD] ${interaction.user.displayName}: ${msg}`
	}

	// send the player a message in the server with the code
	const response = await fetch(`${host}:${port}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_token}`
		},
		body: JSON.stringify(body)
	})

	// checks the message was sent correctly
	if (response.status !== 200) {
		logger.error('Error sending player the message.')
		return { embeds: [embed.setColor('Red').setTitle(`Failed sending the message`)] }
	}

	return {
		embeds: [
			embed.setColor('Green').setTitle(`Message sent to user, sadly there is no way for them to reply at this time.`)
		],
		ephemeral: true
	}
}
