import { PermissionFlagsBits } from 'discord.js'
import { client, createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_player, emailCode, getProfileByDId } from '~/utill'
import email from '../force-link/email'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'list the players currently online',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to warn',
			type: 'member',
			required: false
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const member = options.user || (interaction.member as GuildMember)
	//await client.emit(`guildMemberAdd`, member)
	const dbmem = (await getProfileByDId(member.id)) as db_player
	if (!dbmem.uea_email || !dbmem.mc_username) return `user does not have email or Minecraft username linked`
	emailCode(`${dbmem.uea_email}@uea.ac.uk`, `testing`, dbmem.mc_username)

	return `email sent`
}
