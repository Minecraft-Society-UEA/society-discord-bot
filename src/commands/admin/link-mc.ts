import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, logger, setState } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { connected_players, db_player, tokens } from '../../utill/types'
import { getTokens } from '../../utill/functions'
import { getProfileByDId, getProfileByMcUsername, updatePlayerProfile } from '../../utill/database_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to warn',
			type: 'member',
			required: true
		},
		{
			name: 'mc_username',
			description: 'the users minecraft username',
			type: 'string',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guildId) return
	// declaring variables we need
	const user = options.user
	const mc_name = options.mc_username
	if (!user || !mc_name) return { content: `user you selected is invalid or error in the mc name` }
	const embed = new EmbedBuilder()
	const profile = (await getProfileByDId(user.id)) as db_player
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const tokens = getTokens() as tokens
	const already_verified = await getProfileByDId(user.id)
	const username_inuse = await getProfileByMcUsername(mc_name)
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
	const player = data_hub.online_players.find((p) => p.name === mc_name)

	// if the username isnt found in the player list tells them
	if (!player)
		return { embeds: [embed.setColor('Red').setTitle(`No player with username: ${mc_name} connected to Hub`)] }

	profile.mc_username === player.name
	profile.mc_uuid === player.uuid
	profile.mc_rank === `verified`

	await updatePlayerProfile(user.id, profile)

	// create embed
	embed
		.setColor(`Green`)
		.setTitle(`${user.displayName} is now linked to ${player.name}(${player.uuid})`)
		.setThumbnail(user.displayAvatarURL())
		.setTimestamp()

	// send the message
	return { embeds: [embed] }
}
