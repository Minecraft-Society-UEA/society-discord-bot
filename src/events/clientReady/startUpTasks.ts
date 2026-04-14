import { ActivityType } from 'discord.js'
import { logger, client } from 'robo.js'
import { loadTokens, refreshOnlinePlayers, updatePlayersChannel } from '~/utill'

export default async () => {
	logger.ready('Database Conection and ready')

	client.user?.setActivity({
		name: `MC Gameplay`,
		type: ActivityType.Watching,
		url: 'https://uncommon34.dev'
	})

	// loads tokens on start up for making requests to the servers
	await loadTokens()
	refreshOnlinePlayers()
	updatePlayersChannel()

	await new Promise((resolve) => setTimeout(resolve, 2000))
}
