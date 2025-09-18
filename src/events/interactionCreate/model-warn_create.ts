import { ModalSubmitInteraction, Client, EmbedBuilder } from 'discord.js'
import { getState, setState } from 'robo.js'
import { db_warns } from '../../utill/types'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit()) return

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `warn_model_reason-${interaction.user.id}`) {
		const reason = interaction.fields.getTextInputValue('reason') as string
		const warn = getState<db_warns>(`warn_create_${interaction.user.id}`)
		const ids = getState(`warn_msg-${interaction.user.id}`)?.split(`-`)

		if (!warn || !ids)
			return interaction.reply({ content: `error getting stored warning/message bot may require restart` })

		warn.reason = reason

		setState<db_warns>(`warn_create_${interaction.user.id}`, warn)

		const channel = await client.channels.fetch(ids[0])
		if (!channel?.isTextBased()) {
			throw new Error('Channel is not text-based')
		}

		const message = await channel.messages.fetch(ids[1])
		const embed = EmbedBuilder.from(message.embeds[0])

		embed.setDescription(`Reason: \n\n${reason}`)

		await message.edit({
			embeds: [embed]
		})

		await interaction.reply({ content: `use the '/warn image' and upload image/screen shots (up to 4)` })
		return
	}
}
