import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, updatePlayerProfile } from '../../utill/database_functions'
import { db_player, role_storage } from '../../utill/types'
import { mc_command, message_player, online_server_check } from '../../utill/functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'assign tester role to user',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to warn',
			type: 'member',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guild) return
	const user = options.user
	if (!user) return { content: `user you selected is invalid` }
	const profile = (await getProfileByDId(user.id)) as db_player
	const embed = new EmbedBuilder()
	if (!profile || !profile.mc_username) return `error getting profile`

	const online = await online_server_check(profile.mc_username)
	if (!online) return { embeds: [embed.setColor(`Red`).setTitle(`Player isnt online and must be to be made a tester`)] }

	await mc_command(online, `lp user ${profile.mc_username} parent set beta-tester`)
	await message_player(profile.mc_username, `[MC-UEA VERIFY] Successfully Become a Tester`)

	const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
	const role = (await interaction.guild.roles.cache.get(roles.tester)) as Role

	await user.roles.add(role)

	profile.mc_rank = `tester`
	await updatePlayerProfile(user.id, profile)
	embed.setColor(`Green`).setTitle(`✦ Successfully made ${user.displayName} (${profile.mc_username}) a beta tester! Join the server and do /game to join the world.`)

	return { embeds: [embed] }
}
