import { ModalSubmitInteraction, Client } from 'discord.js'
import { createMembers } from '../../utill/database_functions'
import { extractIds, log } from '../../utill/functions'

export default async (interaction: ModalSubmitInteraction, client: Client) => {
	// check if the interaction is a modal submit
	if (!interaction.isModalSubmit() || !interaction.guild || !interaction.guild.members.me)
		return { content: `interaction invalid` }

	// check the modal being submitted matches the custom id set on the mc verifi one
	if (interaction.customId === `update_members-${interaction.user.id}`) {
		await interaction.deferReply({ flags: 'Ephemeral' })
		const html = interaction.fields.getTextInputValue('settings') as string
		log.info(`recived html`)
		const ids = await extractIds(html)
		const bool = await createMembers(ids)
		log.info(`saved members from html`)

		if (bool) interaction.editReply(`Parsed html and added members to db`)
		else {
			log.error(`error parsing/adding new members check console`)
			interaction.editReply(`FAILED`)
		}
	}
}
