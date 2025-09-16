import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { message_player } from '../../utill/functions'
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
	if (!target) return { content: `user you selected is invalid` }

	const profile = await getProfileByDId(target.user.id)

	if (!profile || !profile.mc_username)
		return {
			embeds: [
				embed.setColor('Red').setTitle(`User ${target.displayName} is not linked and therefore cant be messaged`)
			]
		}

	// send the message to the player and return a embed confirming it was sent
	const msg_rtn = await message_player(profile.mc_username, `[DISCORD] ${interaction.user.displayName}: ${msg}`)

	if (!msg_rtn)
		return { embeds: [embed.setColor(`Red`).setTitle(`Likely the player is offline, unlinked or there was a error`)] }

	if (msg_rtn)
		return {
			embeds: [
				embed.setColor('Green').setTitle(`Message sent to user, sadly there is no way for them to reply at this time.`)
			],
			ephemeral: true
		}
}
