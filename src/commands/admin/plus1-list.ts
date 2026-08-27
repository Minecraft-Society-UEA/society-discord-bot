import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { db_player } from '~/utill'

export const config = createCommandConfig({
	description: 'List everyone with an active plus-1',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	const holderIds = (await Flashcore.get<string[]>('plus1_holders')) ?? []

	if (holderIds.length === 0) {
		return { content: 'No active plus-1 assignments.', flags: ['Ephemeral'] }
	}

	const embed = new EmbedBuilder().setTitle('➕ Active Plus-1s').setColor('Blue')

	for (const holderId of holderIds) {
		const plus1 = await Flashcore.get<db_player>(`${holderId}-plus1`)
		if (!plus1) continue
		embed.addFields({ name: `<@${holderId}>`, value: plus1.mc_username ?? 'Unknown', inline: true })
	}

	return { embeds: [embed], flags: ['Ephemeral'] }
}
