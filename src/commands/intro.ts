import {
	ButtonInteraction,
	Client,
	EmbedBuilder,
	GuildMember,
	Message,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CommandInteraction
} from 'discord.js'
import { ChatInputCommandInteraction } from 'discord.js'
import { CommandResult, createCommandConfig } from 'robo.js'
import { dateAfterMinutes } from '../utill/functions'
import { db_warns, db_bans } from '../utill/types'

export const config = createCommandConfig({
	description: "Post introduction to introductions channel init"
})

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	interaction.reply("I AM ALIVE!!!")
}
