import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { client, createCommandConfig, getState, setState } from 'robo.js'
import type { Attachment, ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_warns } from '../../utill/types'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'image',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'img1',
			description: 'evidence image 1',
			type: 'attachment',
			required: true
		},
		{
			name: 'img2',
			description: 'evidence image 2',
			type: 'attachment',
			required: false
		},
		{
			name: 'img3',
			description: 'evidence image 3',
			type: 'attachment',
			required: false
		},
		{
			name: 'img4',
			description: 'evidence image 4',
			type: 'attachment',
			required: false
		}
	],
	sage: { ephemeral: true },
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	// options is the command options we set above
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	// declaring variables we need
	const embed = new EmbedBuilder()
	const img1 = options.img1 as Attachment
	const img2 = (options.img2 as Attachment) ?? null
	const img3 = (options.img3 as Attachment) ?? null
	const img4 = (options.img4 as Attachment) ?? null
	const alr = (await getState<boolean>(`warn_session_inprog-${interaction.user.id}`)) ?? false
	const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)
	let imgs = [] as string[]

	const ids = getState(`warn_msg-${interaction.user.id}`)?.split(`-`)

	if (!warn || !ids) return { content: `Error getting stored warning/message; bot may require restart` }
	if (!alr) return { embeds: [embed.setColor(`Red`).setTitle("You must have opened the warning in order to use this")] }

	imgs.push(img1.url)
	if (img2) imgs.push(img2.url)
	if (img3) imgs.push(img3.url)
	if (img4) imgs.push(img4.url)

	warn.img = imgs

	await setState<db_warns>(`warn_create_${interaction.user.id}`, warn)

	const channel = await client.channels.fetch(ids[0])
	if (!channel?.isTextBased()) {
		throw new Error('Channel is not text-based')
	}

	const message = await channel.messages.fetch(ids[1])
	const embed_new = EmbedBuilder.from(message.embeds[0])

	embed.spliceFields(2, 1, {
		name: 'Supporting Image Links: ',
		value: `Added ${imgs.length} image links`
	})

	await message.edit({
		embeds: [embed_new]
	})

	return { embeds: [embed.setColor(`Green`).setTitle(`Added images to Supporting Images on warning`)] }
}
