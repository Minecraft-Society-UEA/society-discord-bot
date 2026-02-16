import { ActivityType, TextChannel } from 'discord.js'
import { client, Flashcore, logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { loadTokens, refreshOnlinePlayers, updatePlayersChannel } from '~/utill'

export default async () => {
	logger.ready('Database Conection and ready')

	client.user?.setActivity({
		name: ``,
		type: ActivityType.Watching,
		url: 'https://uncommmon.dev'
	})

	// loads tokens on start up for making requests to the servers
	await loadTokens()
	refreshOnlinePlayers()
	updatePlayersChannel()
	// create a cron job to go off on every 12th hour t oreload the tokens with fresh ones
	const scheduler1 = new ToadScheduler()
	const scheduler2 = new ToadScheduler()
	const scheduler3 = new ToadScheduler()

	const task_load_tokens = new AsyncTask('fetch tokens', async () => {
		try {
			await loadTokens()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	async function refreshandchannle() {
		await refreshOnlinePlayers()
		updatePlayersChannel()
	}

	const task_update_players = new AsyncTask('update player message and channel', async () => {
		try {
			refreshOnlinePlayers()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshandchannle()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshOnlinePlayers()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshandchannle()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshOnlinePlayers()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshandchannle()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const task_2h = new AsyncTask('misc tasks 2h', async () => {
		try {
			const messageId = await Flashcore.get<string>(`players_msg_id`)

			const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
			if (!guild) return console.error(`Guild not found`)

			const textChannel = guild.channels.cache.get(process.env.SERVER_LIST_CHANNEL_ID) as TextChannel
			if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)

			if (messageId) {
				const msg = await textChannel.messages.fetch(messageId)
				await msg.delete()
				await Flashcore.delete(`players_msg_id`)
			}
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const job_load_tokens = new CronJob({ cronExpression: '0 */6 * * *' }, task_load_tokens, { preventOverrun: true })
	const job_update_players = new CronJob({ cronExpression: '*/1 * * * *' }, task_update_players, {
		preventOverrun: true
	})
	const job_2h = new CronJob({ cronExpression: '0 */2 * * *' }, task_2h, {
		preventOverrun: true
	})

	scheduler1.addCronJob(job_load_tokens)
	scheduler2.addCronJob(job_update_players)
	scheduler3.addCronJob(job_2h)

	logger.ready(
		'started cron jobs to fetch new tokens every 12th hour and refresh the online players every minute and the 2h misc job'
	)
}
