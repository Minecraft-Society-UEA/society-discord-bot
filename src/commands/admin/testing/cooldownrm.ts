import { PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'list the players currently online',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	await Flashcore.delete(`lastused`)
	return `reset`
}
