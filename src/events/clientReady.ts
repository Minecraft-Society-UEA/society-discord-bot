import { ActivityType } from 'discord.js'
import { client, logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { loadTokens } from '../utill/functions'
import mariadb from 'mariadb'
import { db_player } from '../utill/types'

export const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	connectionLimit: 10
})

export default async () => {
	logger.ready('Database Conection and ready')

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
