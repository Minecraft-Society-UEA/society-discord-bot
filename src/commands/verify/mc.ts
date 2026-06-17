import {
	ActionRowBuilder,
	EmbedBuilder,
	ModalBuilder,
	Role,
	TextInputBuilder,
	TextInputStyle,
	type ChatInputCommandInteraction
} from 'discord.js'
import { createCommandConfig, Flashcore, logger } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	getServerByID,
	getSettingByid,
	role_settings,
	getProfileByMcUsername,
	db_player,
	getProfileByDId,
	fetchServerPlayers,
	sendPlayerMessage,
	generateCode,
	HUB_SERVER_ID
} from '~/utill'

export const config = createCommandConfig({
	description: 'CLICK HERE to link your Minecraft account to our Discord',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'mc-username',
			description: 'mc username exactly how it is in the player list',
			type: 'string',
			required: true
		}
	]
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const server = await getServerByID(HUB_SERVER_ID)
	if (!server || !interaction.guild) return `db server = null or invlid guild`
	const username = options['mc-username']
	const embed = new EmbedBuilder()
	const roles = (await getSettingByid(`roles`)) as role_settings
	const role = (await interaction.guild.roles.cache.get(roles.setting.committee)) as Role

	// fetch db profiles
	const already_verified = (await getProfileByMcUsername(username)) as db_player | null
	const username_inuse = (await getProfileByDId(interaction.user.id)) as db_player | null

	if (!already_verified && !username_inuse?.mc_username) {
		// pull hub players
		const data_hub = await fetchServerPlayers(server)

		if (!data_hub) {
			console.log(`hub is down`)
			return {
				content: `${role}`,
				embeds: [
					embed.setColor('Red').setTitle('🫤 Sorry, I cannot connect to the server. Ask committee for assistance!')
				]
			}
		}
		// find player in hub
		const player = data_hub.find((p) => p.name === username)
		if (!player) {
			console.log(`Player "${username}" is not connected to the Hub`)
			return {
				content: `${role}`,
				embeds: [
					embed
						.setColor('Yellow')
						.setTitle(`🤔 "${username}" has not joined the Minecraft lobby. See #help for more info on how to join`)
				]
			}
		}
		// generate code + store
		const code = generateCode()
		await Flashcore.set(`verify_code-${interaction.user.id}`, code)
		await Flashcore.set(`verify_code-mc_username-${interaction.user.id}`, player.name)
		await Flashcore.set(`verify_code-mc_uuid-${interaction.user.id}`, player.uuid)

		// send code in-game
		const sent = await sendPlayerMessage(server, player.name, `UEAMCSOC VERIFY ✦ Code: ${code}`)

		if (!sent) {
			logger.error('Error sending player the code.')
		}

		// build modal
		const codeInput = new TextInputBuilder()
			.setCustomId('mc-code')
			.setLabel('Input the code whispered to you in-game')
			.setMaxLength(5)
			.setPlaceholder('e.g: AB123')
			.setRequired(true)
			.setStyle(TextInputStyle.Short)

		const modal = new ModalBuilder()
			.setCustomId(`mc-code-${interaction.user.id}`)
			.setTitle('Minecraft Verification Code')
			.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput))
		// show modal (first and only response here)

		await interaction.showModal(modal)
	} else if (already_verified?.mc_username || username_inuse?.mc_uuid) {
		return {
			content: `${role}`,
			embeds: [
				embed
					.setColor('Yellow')
					.setTitle('👉 You have already successfully verified on Minecraft or that username is in use.')
			]
		}
	}
}
