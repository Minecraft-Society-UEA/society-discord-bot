import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ModalActionRowComponentBuilder,
	ChatInputCommandInteraction,
	ModalSubmitInteraction,
} from 'discord.js'
import { CommandResult, createCommandConfig } from 'robo.js'

export const config = createCommandConfig({
	description: "Post introduction to introductions channel init"
})

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	enum ModalFieldRefs {
		AGE = "userAge",
		COURSE_YEAR = "userCourseAndYear",
		LIKES = "userLikes",
		DISLIKES = "userDislikes",
		BIO = "userBio"
	}

	const modal = 
		new ModalBuilder()
			.setCustomId('intro-' + interaction.user.id)
			.setTitle("Welcome to the Society");

	const inputs = [
		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.AGE)
			.setLabel("How old are you?")
			.setPlaceholder("I am ... years old")
			.setStyle(TextInputStyle.Short),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.COURSE_YEAR)
			.setLabel("Your course & year")
			.setPlaceholder("Course name, how far you are into it")
			.setStyle(TextInputStyle.Short),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.LIKES)
			.setLabel("Likes?")
			.setPlaceholder("I like ...")
			.setStyle(TextInputStyle.Paragraph),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.DISLIKES)
			.setLabel("Dislikes?")
			.setPlaceholder("I don't like ...")
			.setStyle(TextInputStyle.Paragraph),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.BIO)
			.setLabel("Bio")
			.setPlaceholder("Tell us a little more about yourself ...")
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
	]
	
	const actionRows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

	inputs.forEach((textInput: TextInputBuilder) => actionRows.push(
		new ActionRowBuilder<TextInputBuilder>()
			.addComponents(textInput)
	));

	modal.addComponents(...actionRows);

	interaction.showModal(modal)
		.catch((c) => {
			throw new Error(c);
		});

		const filter = async (i: ModalSubmitInteraction) => {
			return i.user.id === interaction.user.id;
		};

		interaction
			.awaitModalSubmit({ time: 60_000, filter })
			.then(async (onSubmit) => {
				const [
					age,
					courseYear,
					likes,
					dislikes,
					bio
				] = [
					onSubmit.fields.getTextInputValue(ModalFieldRefs.AGE),
					onSubmit.fields.getTextInputValue(ModalFieldRefs.COURSE_YEAR),
					onSubmit.fields.getTextInputValue(ModalFieldRefs.LIKES),
					onSubmit.fields.getTextInputValue(ModalFieldRefs.DISLIKES),
					onSubmit.fields.getTextInputValue(ModalFieldRefs.BIO)
				]
				interaction.followUp(
`
════「 ✦ 𝐍𝐚𝐦𝐞 ✦ 」═════════
▸Age 󠀠󠀠󠀠→ ${age}
▸Course/Year → ${courseYear}
▸Likes 𖹭 → ${likes}
▸Dislikes × → ${dislikes}
${bio ? "▸Bio → " + bio : ""}
═══════════════════════ 
`					
				)
			})
}
