import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { fetchTableHtml, extractIds, createMembers, validateMembers, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Manually trigger a membership list sync (bypasses cooldown)',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	await interaction.deferReply({ ephemeral: true })

	const embed = new EmbedBuilder()

	try {
		const html = await fetchTableHtml()
		if (!html) {
			await interaction.editReply({
				embeds: [embed.setColor('Red').setTitle('❌ Sync failed').setDescription('Could not fetch the membership table from UEASU.')]
			})
			return
		}

		const ids = await extractIds(html)
		await createMembers(ids)
		await validateMembers()

		log.info(`Admin manual sync: processed ${ids.length} membership IDs`)

		await interaction.editReply({
			embeds: [
				embed
					.setColor('Green')
					.setTitle('✅ Membership sync complete')
					.setDescription(`Processed **${ids.length}** membership entries from UEASU.`)
			]
		})
	} catch (err) {
		log.error(`Admin sync-members error: ${err}`)
		await interaction.editReply({
			embeds: [embed.setColor('Red').setTitle('❌ Sync error').setDescription(`${err}`)]
		})
	}
}
