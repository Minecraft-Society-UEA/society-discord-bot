import { ModalSubmitInteraction, Client, EmbedBuilder, GuildMember, Role } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import { mc_command, message_player } from '../../utill/functions'
import { db_player, role_storage } from '../../utill/types'
import { createPlayerProfile, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild || !interaction.guild.members.me)
		return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `mc-code-${interaction.user.id}`) {
		// get the original code and the one the player inputed
		const code = interaction.fields.getTextInputValue('mc-code') as string
		const user_code = (await Flashcore.get(`verify_code-${interaction.user.id}`)) as string
		const embed = new EmbedBuilder()

		// compare if they match
		if (code === user_code) {
			// declaring variables we need
			const username = (await Flashcore.get(`verify_code-mc_username-${interaction.user.id}`)) as string
			const uuid = (await Flashcore.get(`verify_code-mc_uuid-${interaction.user.id}`)) as string
			const member = interaction.member as GuildMember
			const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
			const role = (await interaction.guild.roles.cache.get(roles.mc_verified)) as Role

			await member.roles.add(role)

			// add the players permitions
			await mc_command(`hub`, `lp user ${username} promote player`)

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

			// set player nickname in disocrds
			if (
				interaction.guild.members.me?.roles.highest.comparePositionTo(member.roles.highest) > 0 &&
				member.id !== interaction.guild.ownerId
			) {
				await member.setNickname(`${member.user.username} ✧ ${username}`)
			} else {
				logger.warn(`Cannot change nickname of ${member.user.tag}: insufficient role hierarchy or member is owner`)
			}

			return { embeds: [embed.setTitle(`✦ Successfully Verified`).setColor('Green')] }
		} else {
			return { embeds: [embed.setTitle(`Failed Codes mismatched`).setColor(`Red`)] }
		}
	}
}
