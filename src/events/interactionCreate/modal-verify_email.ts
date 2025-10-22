import { ModalSubmitInteraction, Client, EmbedBuilder, GuildMember, Role } from 'discord.js'
import { Flashcore, logger } from 'robo.js'
import { db_player, role_storage } from '../../utill/types'
import { getProfileByDId, updatePlayerProfile } from '../../utill/database_functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild?.members.me) return

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `verifiy-email-code-${interaction.user.id}`) {
		await interaction.deferReply({ flags: 'Ephemeral' })
		// get the original code and the one the player inputed
		const code = interaction.fields.getTextInputValue('email-code') as string
		const name_pref = interaction.fields.getTextInputValue('name') as string
		const user_code = (await Flashcore.get(`verify_email-code-${interaction.user.id}`)) as string
		const member = interaction.member as GuildMember
		const embed = new EmbedBuilder()

		if (!member) interaction.editReply({ content: `guild member invalid` })

		// compare if they match
		if (code === user_code) {
			// declaring variables we need
			const email = (await Flashcore.get(`verify_email-email-${interaction.user.id}`)) as string

			// create a player profile in the database
			const playerProfile = (await getProfileByDId(interaction.user.id)) as db_player

			// add the players data
			playerProfile.uea_email = email

			// update the players profile with the new data
			await updatePlayerProfile(interaction.user.id, playerProfile)

			const roles = (await Flashcore.get(`mc_role_id`)) as role_storage

			if (
				interaction.guild.members.me?.roles.highest.comparePositionTo(member.roles.highest) > 0 &&
				member.id !== interaction.guild.ownerId
			) {
				await member.setNickname(`${name_pref} ✧ ${playerProfile.mc_username}`)
				await member.roles.add((await interaction.guild.roles.cache.get(roles.email_verified)) as Role)
			} else {
				logger.warn(`Cannot change nickname of ${member.user.tag}: insufficient role hierarchy or member is owner`)
			}

			return await interaction.editReply({
				embeds: [embed.setTitle(`✦ Successfully Verified UEA Email`).setColor('Green')]
			})
		} else {
			return await interaction.editReply({
				embeds: [embed.setTitle(`Code does not match, please try again`).setColor(`Red`)]
			})
		}
	}
}
