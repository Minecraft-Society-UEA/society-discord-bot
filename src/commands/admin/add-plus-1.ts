import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_player, getProfileByDId, online_server_check, mc_command, message_player } from '~/utill/index.js'

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

	const plus1 = (await Flashcore.get(`${interaction.user.id}-plus1`)) as db_player

	if (plus1) return { content: `you already have a plus 1 (${plus1.mc_username})`, flags: `Ephemeral` }

	const user = options.user
	if (!user) return { content: `Invalid user` }
	const profile = (await getProfileByDId(user.id)) as db_player
	const embed = new EmbedBuilder()
	if (!profile || !profile.mc_username)
		return { content: `Could not fetch data for Minecraft user or no Minecraft username`, flags: `Ephemeral` }

	const online = await online_server_check(profile.mc_username)
	if (!online)
		return {
			embeds: [embed.setColor(`Red`).setTitle(`Player isnt online and must be to be given the permitions`)],
			flags: `Ephemeral`
		}

	await mc_command(online, `lp user ${profile.mc_username} parent set plus-1`)
	await message_player(profile.mc_username, `[MC-UEA VERIFY] Successfully Become a plus 1`)

	await Flashcore.set(`${interaction.user.id}-plus1`, profile)

	embed
		.setColor(`Green`)
		.setTitle(
			`✦ Successfully made ${user.nickname} (${profile.mc_username}) your plus 1! Join the server and do \`/game\` to join the world.`
		)

	return { embeds: [embed], flags: `Ephemeral` }
}
