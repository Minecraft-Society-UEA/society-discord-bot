import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_player } from '../../utill/types'
import { getProfileByDId, getProfileByUeaEmail, updatePlayerProfile } from '../../utill/database_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
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
			name: 'uea_email',
			description: 'the users uea email address',
			type: 'string',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guildId) return
	// declaring variables we need
	const user = options.user
	const email = options.uea_email
	if (!user || !email) return { content: `user you selected is invalid or error in the mc name` }
	const embed = new EmbedBuilder()
	const profile = (await getProfileByDId(user.id)) as db_player

	const already_verified = (await getProfileByDId(interaction.user.id)) as db_player
	const email_inuse = await getProfileByUeaEmail(email)

	// checks if there email is a uea email
	if (!email.match(/^[A-Za-z]{3}[0-9]{2}[A-Za-z]{3}@uea\.ac\.uk/gm))
		return { embeds: [embed.setTitle(`Please enter a valid UEA Email`).setColor('Red')], ephemeral: true }

	// checking if the user already has verifide
	if (!already_verified)
		return {
			embeds: [
				embed
					.setTitle(`you need to verify on Minecraft first with: /verify mc or the admin needs todo /admin link-mc`)
					.setColor('Red')
			],
			ephemeral: true
		}
	if (already_verified.uea_email)
		return { embeds: [embed.setTitle(`already verified your email`).setColor('Green')], ephemeral: true }

	//checking if username is already linked
	if (!email_inuse)
		return {
			embeds: [
				embed.setTitle(
					`email is already verifide under a diffrent user if this is your account contact a member of the committee`
				)
			]
		}

	profile.uea_email === email
	await updatePlayerProfile(user.id, profile)

	// create embed
	embed
		.setColor(`Green`)
		.setTitle(`${user.displayName} is now linked to ${email}`)
		.setThumbnail(user.displayAvatarURL())
		.setTimestamp()

	// send the message
	return { embeds: [embed] }
}
