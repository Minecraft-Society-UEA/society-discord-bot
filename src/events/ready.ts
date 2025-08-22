import { ActivityType } from 'discord.js'
import postgres from 'postgres'
import { client, logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { loadTokens } from '../utill/functions'

export default async () => {
	logger.ready('Database Connected and ready')

	client.user?.setActivity({
		name: `For Players`,
		type: ActivityType.Watching,
		url: 'https://uncommmon.dev'
	})

	// loads tokens on start up for making requests to the servers
	await loadTokens()

	// create a cron job to go off on every 12th hour t oreload the tokens with fresh ones
	const scheduler = new ToadScheduler()

	const task = new AsyncTask('fetch tokens', async () => {
		try {
			await loadTokens()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const job = new CronJob({ cronExpression: '0 */12 * * *' }, task, { preventOverrun: true })
	scheduler.addCronJob(job)
	logger.ready('started cron job to fetch new tokens every 12th hour')
}

// the sql database object
export const sql = postgres({
	host: process.env.POSTGRES_HOST,
	port: process.env.POSTGRES_PORT,
	database: process.env.POSTGRES_DATABASE,
	username: process.env.POSTGRES_USERNAME,
	password: process.env.POSTGRES_PASSWORD
})
