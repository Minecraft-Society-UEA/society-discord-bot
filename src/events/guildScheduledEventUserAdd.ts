import { GuildScheduledEvent, User } from 'discord.js'
import { client, Flashcore } from 'robo.js'
import { log } from '~/utill'

export default async (event: GuildScheduledEvent, user: User) => {
	if (event.id === `1436429199106773062`) {
		const sav = (await Flashcore.get<string[]>(`hg-event-players`)) ?? []
		const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
		if (!guild) return console.error(`Guild not found`)
		const member = await guild.members.fetch(user.id)

		if (sav.length === 24) {
			log.error(`${event.name} is full 24/24 players`)
			const loged = ((await Flashcore.get(`hg-event-loged`)) as boolean) ?? false
			if (!loged) {
				for (const sa of sav) {
					const membersa = await guild.members.fetch(sa)
					log.msgraw(`${membersa}`)
				}
			}
			await Flashcore.set(`hg-event-loged`, true)
		} else {
			log.msgraw(`${event.name} now has ${sav.length}/24 member: ${member}`)
			sav.push(user.id)
			await Flashcore.set(`hg-event-players`, sav)
		}
	}
}
