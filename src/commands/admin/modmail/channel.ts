import { ChannelType, CommandInteraction, PermissionFlagsBits } from 'discord.js'
import { CommandOptions, CommandResult, Flashcore, client, createCommandConfig } from 'robo.js'

export const config = createCommandConfig({
	description: 'assign tester role to user',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'modmail',
			description: 'modmail fourm channel id',
			type: 'string',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (
	interaction: CommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const option = options.modmail

	const channel = await client.channels.fetch(option.toString())

	if (channel && channel.type !== ChannelType.GuildForum) {
		return { content: 'Please, input the id of a Forum channel.', ephemeral: true }
	}

	await Flashcore.set<string>('modmail_forum', option.toString())

	return { content: 'Modmail Forum has been correctly set !.', ephemeral: true }
}
