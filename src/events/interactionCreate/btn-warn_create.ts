import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonComponent,
	ButtonInteraction,
	Client,
	EmbedBuilder,
	MessageActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js'
import { getState, setState } from 'robo.js'
import { db_player, db_warns } from '../../utill/types'
import { createWarning, getProfileByDId, getWarningsEffectBansByUserId } from '../../utill/database_functions'
import { BAN } from '../../utill/functions'

export default async (interaction: ButtonInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isButton()) return

	if (interaction.customId.startsWith(`warn_btn`)) {
		const alr = (await getState<boolean>(`warn_session_inprog-${interaction.user.id}`)) ?? false
		const embed = new EmbedBuilder()

		if (!alr) {
			interaction.reply({ embeds: [embed.setColor(`Red`).setTitle(`this can only be used if you opened the warning`)] })
			return
		}

		// Im not commenting every button so ill do this one the rest mostly work the same
		// check the modal being submitted matches the custom id
		// edit reason button
		if (interaction.customId === `warn_btn_reason-${interaction.user.id}`) {
			const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)

			if (!warn) return interaction.reply({ content: `error getting stored warning bot may require restart` })

			const modal = new ModalBuilder()
				.setCustomId(`warn_model_reason-${interaction.user.id}`)
				.setTitle('Add/Edit the Reason for the warning')

			//creating the modal to show the user on discord
			const one = new TextInputBuilder()
				.setCustomId(`reason`)
				.setLabel('The Reason for the warning')
				.setMaxLength(1000)
				.setPlaceholder('Reason...')
				.setValue(warn.reason)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)

			const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(one)

			modal.addComponents(firstActionRow)

			// showing the modal to the user
			await interaction.showModal(modal)
			return
		}

		// this one will prompt another command to add effected users
		if (interaction.customId === `warn_btn_effusr-${interaction.user.id}`) {
			const embed = EmbedBuilder.from(interaction.message.embeds[0])

			embed.spliceFields(0, 1, {
				name: 'Effected Users:',
				value: `Adding...`
			})

			await interaction.update({
				embeds: [embed]
			})

			await interaction.reply({
				content: `use the '/warn effected' and select the members who are effected (up to 3 if more add the main 3 then mention the rest in the the reason)`
			})
			return
		}

		// this one will prompt another command to add up tp 3 images
		if (interaction.customId === `warn_btn_img-${interaction.user.id}`) {
			const embed = EmbedBuilder.from(interaction.message.embeds[0])

			embed.spliceFields(2, 1, {
				name: 'Supporting Image Links: ',
				value: `Adding...`
			})

			await interaction.update({
				embeds: [embed]
			})

			await interaction.reply({ content: `use the '/warn image' and upload image/screen shots (up to 4)` })
			return
		}

		// this one will just set it
		if (interaction.customId === `warn_btn_warn-${interaction.user.id}`) {
			const embed = EmbedBuilder.from(interaction.message.embeds[0])
			const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)

			if (!warn) return interaction.reply({ content: `error getting stored warning bot may require restart` })

			warn.warn_effects_bans = false

			await setState<db_warns>(`warn_create_${interaction.user.id}`, warn)

			embed.spliceFields(1, 1, {
				name: `Should this Warning Count to the 3 Warning's Ban`,
				value: `${warn.warn_effects_bans}`
			})

			await interaction.update({
				embeds: [embed]
			})

			return
		}

		// this will confirm and commit the warning
		if (interaction.customId === `warn_btn_confirm-${interaction.user.id}`) {
			const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)
			if (!warn) return { content: `error getting stored warning/message bot may require restart` }

			const profile = (await getProfileByDId(warn.user_id)) as db_player

			if (!profile) return { content: `error getting player profile DB error` }
			if (!interaction.guild) return { content: `error getting Guild` }

			const prev_warn = await getWarningsEffectBansByUserId(warn?.user_id)
			const created = await createWarning(
				warn.user_id,
				interaction.user.id,
				warn.reason,
				warn.img,
				warn.effected_users,
				warn.warn_effects_bans
			)

			const user = await interaction.guild.members.cache.get(warn.user_id)
			const embed = EmbedBuilder.from(interaction.message.embeds[0])
				.setTitle(`⚠️ Warning created for ${user?.displayName}`)
				.setFooter({ text: 'No further changes allowed warning commited' })

			const warnings = prev_warn.length
			const oldestWarning = prev_warn[prev_warn.length - 1]
			const createdAt = new Date(oldestWarning.created_at)
			const expiryDate = new Date(createdAt)
			expiryDate.setFullYear(expiryDate.getFullYear() + 1)

			const dd = String(expiryDate.getDate()).padStart(2, '0')
			const mm = String(expiryDate.getMonth() + 1).padStart(2, '0')
			const yyyy = expiryDate.getFullYear()

			const banned_till = `${dd}/${mm}/${yyyy}`

			if (warnings === 2 && profile.mc_username) {
				await BAN(
					warn.user_id,
					profile.mc_username,
					`has reached 3 warnings and is banned till the first one expires`,
					banned_till
				)
				embed.setDescription(
					`This is the users 3rd warning in a year they have been banned till there oldest warning expires: ${banned_till}\n\nReason: \n${warn.reason}`
				)
			}

			// map through rows and disable all buttons
			const disabledComponents = interaction.message.components.map((row) => {
				const actionRow = row as unknown as ActionRowBuilder<MessageActionRowComponentBuilder>

				return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					actionRow.components.map((component) =>
						ButtonBuilder.from(component as unknown as ButtonComponent).setDisabled(true)
					)
				)
			})

			// update message
			await interaction.update({
				embeds: [embed],
				components: disabledComponents
			})
		}

		// this will cancel and delete the warning
		if (interaction.customId === `warn_btn_cancel-${interaction.user.id}`) {
			const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)
			if (!warn) return { content: `error getting stored warning/message bot may require restart` }
			if (!interaction.guild) return { content: `error getting Guild` }

			const user = await interaction.guild.members.cache.get(warn.user_id)

			const embed = EmbedBuilder.from(interaction.message.embeds[0])
				.setTitle(`⚠️ Warning canceled for ${user?.displayName}`)
				.setFooter({ text: 'No further changes allowed warning disgaurded' })

			// map through rows and disable all buttons
			const disabledComponents = interaction.message.components.map((row) => {
				const actionRow = row as unknown as ActionRowBuilder<MessageActionRowComponentBuilder>

				return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
					actionRow.components.map((component) =>
						ButtonBuilder.from(component as unknown as ButtonComponent).setDisabled(true)
					)
				)
			})

			// update message
			await interaction.update({
				embeds: [embed],
				components: disabledComponents
			})
		}
	}
}
