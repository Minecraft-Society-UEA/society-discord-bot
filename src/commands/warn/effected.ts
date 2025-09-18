import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { client, createCommandConfig, getState, setState } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_warns } from '../../utill/types'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'effect users',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'effected1',
			description: 'first user effected',
			type: 'member',
			required: true
		},
		{
			name: 'effected2',
			description: 'first user effected',
			type: 'member',
			required: false
		},
		{
			name: 'effected3',
			description: 'first user effected',
			type: 'member',
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
	const eff1 = options.effected1
	if (!eff1) return { content: `a user you selected is invalid` }
	const eff2 = options.effected2 ?? null
	const eff3 = options.effected3 ?? null
	const alr = (await getState<boolean>(`warn_session_inprog-${interaction.user.id}`)) ?? false
	const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)
	let eff = [] as string[]
	const ids = getState(`warn_msg-${interaction.user.id}`)?.split(`-`)

	if (!warn || !ids) return { content: `error getting stored warning/message bot may require restart` }
	if (!alr) return { embeds: [embed.setColor(`Red`).setTitle(`this can only be used if you opened the warning`)] }

	eff.push(`${eff1.user.id}`)
	if (eff2) eff.push(`${eff2.user.id}`)
	if (eff3) eff.push(`${eff3.user.id}`)

	warn.effected_users = eff

	await setState<db_warns>(`warn_create_${interaction.user.id}`, warn)

	const channel = await client.channels.fetch(ids[0])
	if (!channel?.isTextBased()) {
		throw new Error('Channel is not text-based')
	}

	const message = await channel.messages.fetch(ids[1])
	const embed_new = EmbedBuilder.from(message.embeds[0])

	embed.spliceFields(0, 1, {
		name: 'Effected Users: ',
		value: `${eff1.displayName}${eff2 ? `, ${eff2.displayName}` : ''}${eff3 ? `, ${eff3.displayName}` : ''}`
	})

	await message.edit({
		embeds: [embed_new]
	})

	return { embeds: [embed.setColor(`Green`).setTitle(`added users to effected users on warning`)] }
}
