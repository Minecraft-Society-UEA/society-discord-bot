import { PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { role_storage } from '../../utill/types'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'role storage',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'stored',
			description: 'the user to warn',
			type: `string`,
			choices: [
				{
					name: `mc_verifide`,
					value: `mc_verifide`
				},
				{
					name: `paid-member`,
					value: `member`
				},
				{
					name: `tester`,
					value: `tester`
				}
			],
			required: true
		},
		{
			name: 'role',
			description: 'the role to save',
			type: `role`,
			options: [],
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
	const role = options.role as Role
	const roletype = options.stored
	const roles = Flashcore.get(`mc_role_id`) as role_storage
	if (!role) return { content: "Invalid role" }

	switch (roletype) {
		case `mc_verifide`:
			roles.mc_verified = role.id
			break
		case `member`:
			roles.member = role.id
			break
		case `tester`:
			roles.tester = role.id
			break
		default:
			return { content: `stored role error` }
	}

	await Flashcore.set(`mc_role_id`, roles)

	return { content: `Successfully updated ${role.name} ${role.id} as "${roletype}" role.` }
}
