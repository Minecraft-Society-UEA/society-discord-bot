import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_player } from '../../utill/types'
import { getProfileByDId } from '../../utill/database_functions'
import { BAN, dateAfterMinutes } from '../../utill/functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'ban users',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to warn',
			type: 'member',
			required: true
		},
		{
			name: 'reason',
			description: 'reason for the ban',
			type: 'string',
			required: true
		},
		{
			name: 'duation',
			description: 'duation of ban in mins leave blank and ban will persist till next september',
			type: `integer`,
			required: false
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
	// declaring variables we need
	const user = options.user
	const reason = options.reason
	const duation =
		options.duation ??
		Math.floor(
			(new Date(
				new Date().getFullYear() + (new Date() >= new Date(`${new Date().getFullYear()}-09-01`) ? 1 : 0),
				8,
				1
			).getTime() -
				Date.now()) /
				60000
		)
	const duationM = `${duation}m`
	if (!user) return { content: `options are invalid` }

	const embed = new EmbedBuilder()
	const profile = (await getProfileByDId(user.id)) as db_player
	if (!profile.mc_username)
		return {
			content: `unabel to ban as there not linked with mc discord bans are still handeled with the discord methords`
		}

	const ban = await BAN(user.id, profile.mc_username, reason, duationM)

	if (ban)
		return {
			embeds: [
				embed
					.setColor(`Red`)
					.setTitle(`${user.displayName} has been banned`)
					.setDescription(`Reason: \n${reason}`)
					.setThumbnail(user.displayAvatarURL())
					.addFields(
						{
							name: `banned for: `,
							value: `${duation} Minutes`
						},
						{
							name: `banned till: `,
							value: `${dateAfterMinutes(duation)}`
						}
					)
					.setTimestamp()
			]
		}
	else return { content: `Failed to Ban ${user.displayName}` }
}
