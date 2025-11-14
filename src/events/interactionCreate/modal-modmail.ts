import { ModalSubmitInteraction } from 'discord.js'
import { getSettingByid, modmailSettings, updateSettings } from '~/utill'

export default async (interaction: ModalSubmitInteraction) => {
	if (!interaction.isModalSubmit()) return
	if (interaction.customId === 'modmail_modal_chatting') {
		const title = interaction.fields.getTextInputValue('title')
		const footer = interaction.fields.getTextInputValue('footer')
		const setting = (await getSettingByid(`modmail`)) as modmailSettings

		setting.setting.customMsg.title = title
		setting.setting.customMsg.footer = footer

		await updateSettings(`modmail`, setting.setting)

		return await interaction.reply({
			content: 'Custom embed for the modmail message has been defined.',
			ephemeral: true
		})
	}
	if (interaction.customId === 'modmail_modal_intro') {
		const title = interaction.fields.getTextInputValue('title')
		const footer = interaction.fields.getTextInputValue('footer')
		const description = interaction.fields.getTextInputValue('description')
		const setting = (await getSettingByid(`modmail`)) as modmailSettings

		setting.setting.introMsg.title = title
		setting.setting.introMsg.footer = footer
		setting.setting.introMsg.description = description

		await updateSettings(`modmail`, setting.setting)

		return await interaction.reply({
			content: 'Custom embed for the intro modmail message has been defined.',
			ephemeral: true
		})
	}
}
