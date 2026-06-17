import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { log, annualMembershipReset } from '~/utill'

export const config = createCommandConfig({
	description: 'Manually trigger the annual membership reset',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'confirm',
			description: 'Set to true to confirm — this removes ALL member roles and clears player_members',
			type: 'boolean',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	if (!options.confirm) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Orange')
					.setTitle('⚠️ Cancelled')
					.setDescription('Set `confirm` to `true` to proceed with the reset.')
			],
			flags: ['Ephemeral']
		}
	}

	await interaction.deferReply({ ephemeral: true })

	try {
		log.info(`Annual membership reset triggered manually by ${interaction.user.tag}`)
		await annualMembershipReset()
		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('✅ Annual reset complete')
					.setDescription('All member roles removed, player_members table cleared, in-game ranks set to `verified`.')
			]
		})
	} catch (err) {
		log.error(`Admin reset-annual error: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Reset failed').setDescription(`${err}`)]
		})
	}
}
