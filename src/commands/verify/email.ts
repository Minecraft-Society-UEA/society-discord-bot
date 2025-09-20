import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import type { db_player } from '../../utill/types'
import { generateCode } from '../../utill/functions'
import { getProfileByDId, getProfileByUeaEmail } from '../../utill/database_functions'
import { emailCode } from '../../utill/email_functions'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'verify and link your uea email allowing us to verify your member status',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'uea-email',
			description: 'your uea email address',
			type: 'string',
			required: true
		}
	],
	sage: { ephemeral: true }
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	// options is the command options we set above
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const email = options['uea-email']
	const button = new ButtonBuilder()
	const embed = new EmbedBuilder()
	const already_verified = (await getProfileByDId(interaction.user.id)) as db_player
	const email_inuse = await getProfileByUeaEmail(email)
	const code = generateCode()

	// checks if there email is a uea email
	if (!email.match(/^[A-Za-z]{3}[0-9]{2}[A-Za-z]{3}@uea\.ac\.uk/gm))
		return { embeds: [embed.setTitle(`Please enter a valid UEA email address`).setColor('Red')], ephemeral: true }

	// checking if the user already has verified
	if (!already_verified)
		return {
			embeds: [embed.setTitle(`You need to verify on Minecraft first with: /verify mc`).setColor('Red')],
			ephemeral: true
		}
	if (already_verified.uea_email)
		return { embeds: [embed.setTitle(`Already verified your email!`).setColor('Green')], ephemeral: true }

	//checking if username is already linked
	if (email_inuse)
		return {
			embeds: [
				embed.setTitle(
					`This email address has already been linked to an account.\nIf you believe that this is in error, please do not hesitate to reach out to the committee staff`
				)
			]
		}

	// store the username, uuid and code under the users discord id
	await Flashcore.set(`verify_email-code-${interaction.user.id}`, code)
	await Flashcore.set(`verify_email-email-${interaction.user.id}`, email)

	// creating the button
	button
		.setCustomId(`btn-${interaction.user.id}-open_email_code_model`)
		.setLabel(`Input Code`)
		.setStyle(ButtonStyle.Primary)

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button)

	await emailCode(email, code, interaction.user.displayName)

	// sending a message and button to open the model
	return {
		embeds: [embed.setTitle(`✦ Press the button to get the pop-up to input your email code`).setColor('Green')],
		components: [row],
		ephemeral: true
	}
}
