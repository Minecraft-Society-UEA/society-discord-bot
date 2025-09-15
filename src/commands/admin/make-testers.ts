import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, updatePlayerProfile } from '../../utill/database_functions'
import { db_player } from '../../utill/types'
import { mc_command, message_player, online_server_check } from '../../utill/functions'

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
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
	sage: { ephemeral: true }
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const user = options.user
	const profile = (await getProfileByDId(user.id)) as db_player
	const embed = new EmbedBuilder()
	if (!profile.mc_username) return

	const online = await online_server_check(profile.mc_username)
	if (!online) return { embeds: [embed.setColor(`Red`).setTitle(`Player isnt online and must be to be made a tester`)] }

	const cmd = await mc_command(online, `lp user ${profile.mc_username} parent set beta-tester`)
	await message_player(profile.mc_username, `[MC-UEA VERIFY] Successfully Become a Tester`)

	profile.mc_rank = `tester`
	await updatePlayerProfile(user.id, profile)
	embed
		.setColor(`Green`)
		.setTitle(`Successfully made ${user.displayName} (${profile.mc_username}) a beta tester`)
		.setDescription(cmd.message)

	return { embeds: [embed] }
}
