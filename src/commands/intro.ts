import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ModalActionRowComponentBuilder,
	ChatInputCommandInteraction,
	PermissionFlagsBits
} from 'discord.js'
import { CommandResult, createCommandConfig } from 'robo.js'

export const config = createCommandConfig({
	description: 'Post introduction to introductions channel init',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.SendMessages
})

export enum ModalFieldRefs {
	AGE = 'userAge',
	COURSE_YEAR = 'userCourseAndYear',
	LIKES = 'userLikes',
	DISLIKES = 'userDislikes',
	BIO = 'userBio'
}

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	const modal = new ModalBuilder().setCustomId('intro-' + interaction.user.id).setTitle('Welcome to the Society')

	const inputs = [
		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.AGE)
			.setLabel('How old are you?')
			.setPlaceholder('I am ... years old')
			.setStyle(TextInputStyle.Short),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.COURSE_YEAR)
			.setLabel('Your course & year')
			.setPlaceholder('Course name, how far you are into it')
			.setStyle(TextInputStyle.Short),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.LIKES)
			.setLabel('Likes?')
			.setPlaceholder('I like ...')
			.setStyle(TextInputStyle.Paragraph),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.DISLIKES)
			.setLabel('Dislikes?')
			.setPlaceholder("I don't like ...")
			.setStyle(TextInputStyle.Paragraph),

		new TextInputBuilder()
			.setCustomId(ModalFieldRefs.BIO)
			.setLabel('Bio')
			.setPlaceholder('Tell us a little more about yourself ...')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
	]

	const actionRows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = []

	inputs.forEach((textInput: TextInputBuilder) =>
		actionRows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(textInput))
	)

	modal.addComponents(...actionRows)

	await interaction.showModal(modal)
}
