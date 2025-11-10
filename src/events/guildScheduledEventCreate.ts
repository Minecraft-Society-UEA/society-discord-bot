import { GuildScheduledEvent } from 'discord.js'
import { log } from './../utill/functions'

export default async (event: GuildScheduledEvent) => {
	log.info(`name: ${event.name} | id: ${event.id}`)
}
