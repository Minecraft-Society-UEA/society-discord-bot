import { ModalSubmitInteraction, Client, TextBasedChannel, Message, EmbedBuilder, GuildMember } from 'discord.js'
import { ModalFieldRefs } from '../../commands/intro'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild) return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set
	if (interaction.customId === `intro-${interaction.user.id}`) {
		await interaction.deferReply({ flags: 'Ephemeral' })
		const [age, courseYear, likes, dislikes, bio] = [
			interaction.fields.getTextInputValue(ModalFieldRefs.AGE),
			interaction.fields.getTextInputValue(ModalFieldRefs.COURSE_YEAR),
			interaction.fields.getTextInputValue(ModalFieldRefs.LIKES),
			interaction.fields.getTextInputValue(ModalFieldRefs.DISLIKES),
			interaction.fields.getTextInputValue(ModalFieldRefs.BIO) ?? ``
		]
		const channel = (await interaction.guild.channels.cache.get(process.env.INTRO_CHANNLE_ID)) as TextBasedChannel
		const embed = new EmbedBuilder()
		const member = interaction.member as GuildMember
		const nick = member.nickname ?? member.displayName

		if (!channel.isSendable() || !channel) return interaction.editReply({ content: 'Failed to get intro channle' })

		embed
			.setAuthor({ name: nick })
			.setThumbnail(member.displayAvatarURL())
			.setDescription(bio)
			.addFields([
				{ name: '\u200B', value: '\u200B' },
				{
					name: `Likes 𖹭`,
					value: likes,
					inline: false
				},
				{
					name: `Dislikes ×`,
					value: dislikes,
					inline: true
				}
			])
			.addFields([
				{
					name: `Course/Year`,
					value: courseYear,
					inline: false
				},
				{
					name: `Age`,
					value: age,
					inline: true
				}
			])

		const message = (await channel.send({ embeds: [embed] })) as Message

		return await interaction.editReply({ content: `Sent you Intro message to ${message.url}` })
	}
}
