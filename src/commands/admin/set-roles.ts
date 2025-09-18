import { EmbedBuilder, flatten, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, updatePlayerProfile } from '../../utill/database_functions'
import { db_player, role_storage } from '../../utill/types'
import { mc_command, message_player, online_server_check } from '../../utill/functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
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
	if (!role) return { content: `role you selected is invalid` }

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

	return { content: `saved ${role.name} as the roll they get for becoming ${roletype}` }
}
