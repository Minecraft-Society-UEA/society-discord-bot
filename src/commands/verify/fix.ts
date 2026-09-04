import { ChatInputCommandInteraction, EmbedBuilder, Role } from "discord.js"
import { createCommandConfig, CommandResult, Flashcore } from "robo.js"
import { getServerByID, HUB_SERVER_ID, getSettingByid, role_settings, getProfileByDId, fetchServerPlayers, mc_command, log } from "~/utill"

export const config = createCommandConfig({
	description: 'Fix your minecraft permissions if you verified last year',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: []
} as const)

export default async (
	interaction: ChatInputCommandInteraction
): Promise<CommandResult> => {
	if (!interaction.guild) return `invalid guild`

	const embed = new EmbedBuilder()
	const roles = (await getSettingByid(`roles`)) as role_settings
	const role = (interaction.guild.roles.cache.get(roles.setting.committee)) as Role

	const profile = await getProfileByDId(interaction.user.id)
	if (!profile?.mc_username) {
		return {
			content: `${role}`,
			embeds: [
				embed.setColor('Red').setTitle('You need to verify on Minecraft first with: /verify mc')
			]
		}
	}

	const alreadyUsed = await Flashcore.get(`fix_used-${interaction.user.id}`)
	if (alreadyUsed) {
		return {
			content: `${role}`,
			embeds: [
				embed.setColor('Yellow').setTitle('You have already synced your rank once!')
			]
		}
	}

	const server = await getServerByID(HUB_SERVER_ID)
	if (!server) {
		return {
			content: `${role}`,
			embeds: [
				embed.setColor('Red').setTitle('Database error - server not found')
			]
		}
	}

	const hubPlayers = await fetchServerPlayers(server)
	if (!hubPlayers) {
		return {
			content: `${role}`,
			embeds: [
				embed.setColor('Red').setTitle('🫤 The hub server is currently offline. Try again later!')
			]
		}
	}

	const playerOnHub = hubPlayers.find((p) => p.name === profile.mc_username)
	if (!playerOnHub) {
		return {
			content: `${role}`,
			embeds: [
				embed.setColor('Yellow').setTitle(`${profile.mc_username} is not currently connected to the Hub server`)
			]
		}
	}

	try {
		if (profile.mc_rank === "verified") {
			await mc_command(server.id, `lp user ${profile.mc_username} parent set verified`)
			await Flashcore.set(`fix_used-${interaction.user.id}`, true)

		return {
			embeds: [
				embed.setColor('Green').setTitle(`✦ Your rank has been synced and fixed!`).setDescription(`Your rank is now set to: **${profile.mc_rank}**`)
			]
		}
		} else if (profile.mc_rank === "member") {
			await mc_command(server.id, `lp user ${profile.mc_username} parent set soc-member`)
			await Flashcore.set(`fix_used-${interaction.user.id}`, true)

		return {
			embeds: [
				embed.setColor('Green').setTitle(`✦ Your rank has been synced and fixed!`).setDescription(`Your rank is now set to: **${profile.mc_rank}**`)
			]
		}
		}
		await Flashcore.set(`fix_used-${interaction.user.id}`, true)

	} catch (err) {
		log.error(`Error executing LuckPerms command: ${err}`)
		return {
			content: `${role}`,
			embeds: [
				embed.setColor('Red').setTitle('An error occurred while syncing your rank. Please ask committee for assistance!')
			]
		}
	}
}
