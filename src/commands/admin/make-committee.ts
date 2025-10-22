import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId } from '../../utill/database_functions'
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
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guild) return
	const user = options.user
	if (!user) return { content: `Invalid user` }
	const profile = (await getProfileByDId(user.id)) as db_player
	const embed = new EmbedBuilder()
	if (!profile || !profile.mc_username)
		return `Could not fetch data for Minecraft user or no Minecraft username/Unverifide`

	const online = await online_server_check(profile.mc_username)
	if (!online)
		return { embeds: [embed.setColor(`Red`).setTitle(`Player isnt online and must be to be made a committee member`)] }

	await mc_command(online, `lp user ${profile.mc_username} promote committee`)
	await message_player(profile.mc_username, `[MC-UEA VERIFY] Successfully Become a committee :tada:`)

	const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
	const role = (await interaction.guild.roles.cache.get(roles.committee)) as Role

	await user.roles.add(role)

	embed.setColor(`Green`).setTitle(`✦ Successfully made ${user} (${profile.mc_username}) a committee member!`)

	return { embeds: [embed] }
}
