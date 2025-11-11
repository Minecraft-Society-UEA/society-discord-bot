import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, logger } from 'robo.js'
import type { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	role_storage,
	getProfileByDId,
	db_player,
	getProfileByMcUsername,
	getServerByID,
	getSettingByid,
	server_token_resolver,
	connected_players,
	updatePlayerProfile
} from '~/utill'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'link mc',
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

type role_settings = {
	setting: role_storage
}

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guild || !interaction.guild.members.me) return
	// declaring variables we need
	const user = options.user
	const mc_name = options.mc_username
	if (!user || !mc_name)
		return { content: `The user you selected is invalid or there is an error in the Minecraft name` }
	const embed = new EmbedBuilder()
	const profile = (await getProfileByDId(user.id)) as db_player
	const already_verified = await getProfileByDId(user.id)
	const username_inuse = await getProfileByMcUsername(mc_name)
	const server = await getServerByID(`a406fbb6-418d-4160-8611-1c180d33da14`)
	const member = interaction.member as GuildMember
	const roles = (await getSettingByid(`roles`)) as role_settings
	if (!server) return `db server = null`
	let data_hub

	// checking if the user already has verifide
	if (!already_verified) return { embeds: [embed.setTitle(`Already verified on minecraft`)] }

	//checking if username is already linked
	if (!username_inuse)
		return {
			embeds: [
				embed.setTitle(
					`This username has already been linked to an account.\nIf you believe that this is in error, please do not hesitate to reach out to the committee staff`
				)
			]
		}

	// pulls the player list from the Hub server
	const response_hub = await fetch(`${server.host}:${server.port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${server_token_resolver(server.id)}`
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
		return `Hub server is down :c`
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

	// set player nickname and roles in disocrds
	if (
		interaction.guild.members.me?.roles.highest.comparePositionTo(member.roles.highest) > 0 &&
		member.id !== interaction.guild.ownerId
	) {
		await member.setNickname(`${member.user.displayName} ✧ ${mc_name}`)
		await member.roles.remove((await interaction.guild.roles.cache.get(roles.setting.unverified)) as Role)
		await member.roles.add((await interaction.guild.roles.cache.get(roles.setting.mc_verified)) as Role)
		await interaction.editReply({ embeds: [embed.setTitle(`✦ Successfully Verified`).setColor('Green')] })
	} else {
		logger.warn(`Cannot change nickname of ${member.user.tag}: insufficient role hierarchy or member is owner`)
	}

	// create embed
	embed
		.setColor(`Green`)
		.setTitle(`${user.displayName} is now linked to ${player.name}(${player.uuid})`)
		.setThumbnail(user.displayAvatarURL())
		.setTimestamp()

	// send the message
	return { embeds: [embed] }
}
