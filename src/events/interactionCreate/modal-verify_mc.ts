import { ModalSubmitInteraction, Client, EmbedBuilder, GuildMember, Role } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import {
	role_storage,
	getSettingByid,
	mc_command,
	createPlayerProfile,
	db_player,
	updatePlayerProfile,
	message_player
} from '~/utill'

type role_settings = {
	setting: role_storage
}

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild || !interaction.guild.members.me)
		return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `mc-code-${interaction.user.id}`) {
		await interaction.deferReply()
		// get the original code and the one the player inputed
		const code = interaction.fields.getTextInputValue('mc-code') as string
		const user_code = (await Flashcore.get(`verify_code-${interaction.user.id}`)) as string
		const embed = new EmbedBuilder()
		const roles = (await getSettingByid(`roles`)) as role_settings
		const role = (await interaction.guild.roles.cache.get(roles.setting.unverified)) as Role
		// compare if they match
		if (code === user_code) {
			// declaring variables we need
			const username = (await Flashcore.get(`verify_code-mc_username-${interaction.user.id}`)) as string
			const uuid = (await Flashcore.get(`verify_code-mc_uuid-${interaction.user.id}`)) as string
			const member = interaction.member as GuildMember

			// add the players permitions
			await mc_command(`a406fbb6-418d-4160-8611-1c180d33da14`, `lp user ${uuid} promote player`)
			// create a player profile in the database
			const playerProfile = (await createPlayerProfile(interaction.user.id)) as db_player

			// add the players data
			playerProfile.mc_rank = `verified`
			playerProfile.mc_username = username
			playerProfile.mc_uuid = uuid

			// update the players profile with the new data
			await updatePlayerProfile(interaction.user.id, playerProfile)

			// send the player a sucsess message
			await message_player(username, `UEAMCSOC VERIFY ✦ Successfully Verified`)

			// set player nickname and roles in disocrds
			if (
				interaction.guild.members.me?.roles.highest.comparePositionTo(member.roles.highest) > 0 &&
				member.id !== interaction.guild.ownerId
			) {
				await member.setNickname(`${member.user.displayName} ✧ ${username}`)
				await member.roles.remove((await interaction.guild.roles.cache.get(roles.setting.unverified)) as Role)
				await member.roles.add((await interaction.guild.roles.cache.get(roles.setting.mc_verified)) as Role)
				await interaction.editReply({ embeds: [embed.setTitle(`✦ Successfully Verified`).setColor('Green')] })
			} else {
				logger.warn(`Cannot change nickname of ${member.user.tag}: insufficient role hierarchy or member is owner`)
				await interaction.editReply({ embeds: [embed.setTitle(`✦ Successfully Verified`).setColor('Green')] })
			}
		} else {
			await interaction.editReply({
				content: `${role}`,
				embeds: [embed.setTitle(`Code does not match, please try again`).setColor(`Red`)]
			})
		}
	}
}
