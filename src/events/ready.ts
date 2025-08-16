import { ActivityType } from 'discord.js'
import postgres from 'postgres'
import { client, logger, setState } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { token } from '../utill/types'

export default async () => {
	logger.ready('Database Connected and ready')

	client.user?.setActivity({
		name: ':staruea: Verifying Players',
		type: ActivityType.Custom,
		url: 'https://uncommmon.dev'
	})

	await loadTokens()

	const scheduler = new ToadScheduler()

	const task = new AsyncTask('fetch trivia question', async () => {
		try {
			await loadTokens()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const job = new CronJob({ cronExpression: '0 */6 * * *' }, task, { preventOverrun: true })
	scheduler.addCronJob(job)
	logger.ready('started cron job to fetch new tokens every 6th hour')
}

export const sql = postgres({
	host: process.env.POSTGRES_HOST,
	port: process.env.POSTGRES_PORT,
	database: process.env.POSTGRES_DATABASE,
	username: process.env.POSTGRES_USERNAME,
	password: process.env.POSTGRES_PASSWORD
})

async function loadTokens() {
	const user = process.env.MC_USER
	const pass = process.env.MC_PASS
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const s_port = process.env.SURVIVAL_PORT
	const c_port = process.env.CREATIVE_PORT
	const e_port = process.env.EVENT_PORT

	const body = {
		username: user,
		password: pass
	}

	try {
		const response = await fetch(`${host}:${h_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to hub.')
		} else {
			const data = (await response.json()) as token
			await setState('hub_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for hub:', err)
	}

	try {
		const response = await fetch(`${host}:${s_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to survival.')
		} else {
			const data = (await response.json()) as token
			await setState('survival_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for survival:', err)
	}

	try {
		const response = await fetch(`${host}:${c_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to creative.')
		} else {
			const data = (await response.json()) as token
			await setState('creative_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for creative:', err)
	}

	try {
		const response = await fetch(`${host}:${e_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to event.')
		} else {
			const data = (await response.json()) as token
			await setState('event_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for event:', err)
	}
	logger.info(`logged in to all servers and stored tokens`)
}
