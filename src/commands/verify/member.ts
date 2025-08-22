import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import type { check_member_return } from '../../utill/types'
import { checkMember } from '../../utill/functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	sage: { ephemeral: true }
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	interaction: ChatInputCommandInteraction
): Promise<CommandResult> => {
	// declaring variables we need
	const embed = new EmbedBuilder()

	const mem = (await checkMember(interaction.user.id)) as check_member_return

	return { embeds: [embed.setTitle(mem.message).setColor(mem.colour)] }
}
