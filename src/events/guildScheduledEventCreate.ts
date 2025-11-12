import { GuildScheduledEvent } from 'discord.js'
import { log } from '~/utill'

export default async (event: GuildScheduledEvent) => {
	log.info(`name: ${event.name} | id: ${event.id}`)
}
