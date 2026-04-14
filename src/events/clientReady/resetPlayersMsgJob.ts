import { ActivityType, TextChannel } from 'discord.js'
import { client, Flashcore, logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { loadTokens, refreshOnlinePlayers, updatePlayersChannel } from '~/utill'

export default async () => {
	// create a cron job to go off on every 12th hour t oreload the tokens with fresh ones

	const scheduler3 = new ToadScheduler()

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

	const job_2h = new CronJob({ cronExpression: '0 */2 * * *' }, task_2h, {
		preventOverrun: true
	})

	scheduler3.addCronJob(job_2h)
}
