import { PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction, Role } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { role_storage, setting_return } from '../../utill/types'
import { getSettingByid, updateSettings } from '../../utill/database_functions'

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
				},
				{
					name: `email_verified`,
					value: `email_verified`
				},
				{
					name: `committee`,
					value: `committee`
				},
				{
					name: `unverified`,
					value: `unverified`
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
	const role = options.role as Role
	const roletype = options.stored
	const roles = (await getSettingByid(`roles`)) as role_settings
	if (!role) return { content: 'Invalid role' }

	switch (roletype) {
		case `mc_verifide`:
			roles.setting.mc_verified = role.id
			break
		case `member`:
			roles.setting.member = role.id
			break
		case `tester`:
			roles.setting.tester = role.id
			break
		case `email_verified`:
			roles.setting.email_verified = role.id
			break
		case `unverified`:
			roles.setting.unverified = role.id
			break
		case `committee`:
			roles.setting.committee = role.id
			break
		default:
			return { content: `stored role error` }
	}

	await updateSettings(`roles`, roles.setting)

	return { content: `Successfully updated ${role.name} | ${role.id} as "${roletype}" role.`, flags: [`Ephemeral`] }
}
