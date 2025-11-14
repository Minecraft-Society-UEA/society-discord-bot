import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	role_storage,
	getProfileByDId,
	db_player,
	online_server_check,
	mc_command,
	message_player,
	getSettingByid,
	updatePlayerProfile
} from '~/utill'

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

type role_settings = {
	setting: role_storage
}

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
	if (!profile || !profile.mc_username) return `Could not fetch data for Minecraft user or no Minecraft username`

	const online = await online_server_check(profile.mc_username)
	if (!online) return { embeds: [embed.setColor(`Red`).setTitle(`Player isnt online and must be to be made a tester`)] }

	await mc_command(online, `lp user ${profile.mc_username} parent set beta-tester`)
	await message_player(profile.mc_username, `[MC-UEA VERIFY] Successfully Become a Tester :tada:`)

	const roles = (await getSettingByid(`roles`)) as role_settings
	const role = (await interaction.guild.roles.cache.get(roles.setting.tester)) as Role

	await user.roles.add(role)

	profile.mc_rank = `tester`
	await updatePlayerProfile(user.id, profile)
	embed
		.setColor(`Green`)
		.setTitle(
			`✦ Successfully made ${user} (${profile.mc_username}) a beta tester! Join the server and do \`/game\` to join the world.`
		)

	return { embeds: [embed] }
}
