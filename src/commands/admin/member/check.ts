import { PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { validateMembers } from '../../../utill/functions'

export const config = createCommandConfig({
	description: 'verify and link your mc to the discord allowing you to join',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	await validateMembers()

	return `validated all members where aplicable`
}
