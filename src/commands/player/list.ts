import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, logger } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { connected_players, tokens } from '../../utill/types'
import { getTokens } from '../../utill/functions'

export const config = createCommandConfig({
	description: 'Unlock the hidden prowess of someone',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
	// options: [],
	// sage: {ephemeral: true}
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const s_port = process.env.SURVIVAL_PORT
	const c_port = process.env.CREATIVE_PORT
	const e_port = process.env.EVENT_PORT
	const tokens = getTokens() as tokens
	const embed = new EmbedBuilder()

	let data_hub
	let data_survival
	let data_creative
	let data_event

	const response_hub = await fetch(`${host}:${h_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.hub}`
		}
	})
	if (!response_hub.ok) {
		logger.error('Error getting hub players.')
	} else {
		data_hub = (await response_hub.json()) as connected_players
	}

	const response_survival = await fetch(`${host}:${s_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.survival}`
		}
	})
	if (!response_survival.ok) {
		logger.error('Error getting survival players.')
	} else {
		data_survival = (await response_survival.json()) as connected_players
	}

	const response_creative = await fetch(`${host}:${c_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.creative}`
		}
	})
	if (!response_creative.ok) {
		logger.error('Error getting creative players.')
	} else {
		data_creative = (await response_creative.json()) as connected_players
	}

	const response_event = await fetch(`${host}:${e_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.event}`
		}
	})
	if (!response_event.ok) {
		logger.error('Error getting event players.')
	} else {
		data_event = (await response_event.json()) as connected_players
	}

	if (!data_hub || !data_survival || !data_creative || !data_event) {
		return `one or more servers are down`
	}

	const total_online =
		data_hub?.online_players.length +
		data_survival?.online_players.length +
		data_creative.online_players.length +
		data_event.online_players.length

	embed
		.setColor('DarkPurple')
		.setTitle('online players across all servers')
		.setDescription(`Online: ${total_online}/300`)
		.addFields(
			{
				name: `The Hub: ${data_hub.online_players.length} Player's`,
				value: `${data_hub.online_players.map((player) => player.name).join(', ')}`
			},
			{
				name: `Survival: ${data_survival.online_players.length} Player's`,
				value: `${data_survival.online_players.map((player) => player.name).join(', ')}`
			},
			{
				name: `Creative: ${data_creative.online_players.length} Player's`,
				value: `${data_creative.online_players.map((player) => player.name).join(', ')}`
			},
			{
				name: `Event: ${data_event.online_players.length} Player's`,
				value: `${data_event.online_players.map((player) => player.name).join(', ')}`
			}
		)
		.setTimestamp()

	return { embeds: [embed] }
}
