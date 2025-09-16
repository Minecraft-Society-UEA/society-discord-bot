import { PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { deleteWarning } from '../../utill/database_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'warning_id',
			description: 'tthe id from the warning you want to delete',
			type: 'string',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
	sage: { ephemeral: true }
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guildId) return
	const id = options.warning_id

	await deleteWarning(id)

	return { content: `deleted warning` }
}
