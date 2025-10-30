import { ModalSubmitInteraction, Client } from 'discord.js'
import { ModalFieldRefs } from '../../commands/intro'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild) return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set
	if (interaction.customId === `intro-${interaction.user.id}`) {
		const [age, courseYear, likes, dislikes, bio] = [
			interaction.fields.getTextInputValue(ModalFieldRefs.AGE),
			interaction.fields.getTextInputValue(ModalFieldRefs.COURSE_YEAR),
			interaction.fields.getTextInputValue(ModalFieldRefs.LIKES),
			interaction.fields.getTextInputValue(ModalFieldRefs.DISLIKES),
			interaction.fields.getTextInputValue(ModalFieldRefs.BIO)
		]
		interaction.followUp(
			`
════「 ✦ 𝐍𝐚𝐦𝐞 ✦ 」═════════
▸Age 󠀠󠀠󠀠→ ${age}
▸Course/Year → ${courseYear}
▸Likes 𖹭 → ${likes}
▸Dislikes × → ${dislikes}
${bio ? '▸Bio → ' + bio : ''}
═══════════════════════ 
`
		)
	}
}
