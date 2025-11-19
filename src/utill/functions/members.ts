import puppeteer from 'puppeteer'
import { client } from 'robo.js'
import {
	getAllMembers,
	getProfileByUeaEmail,
	updateMember,
	mc_command,
	updatePlayerProfile,
	db_member,
	db_player,
	log
} from '~/utill'
import * as cheerio from 'cheerio'

export function extractIds(html: string): string[] {
	const $ = cheerio.load(html)
	const results: string[] = []

	$('tr').each((_, el) => {
		const tds = $(el).find('td')
		if (tds.length >= 2) {
			const text = $(tds[1]).text().trim()
			if (text) results.push(text)
		}
	})

	return results
}

export async function validateMembers() {
	const members = (await getAllMembers()) as db_member[]
	for (const member of members) {
		const profile = (await getProfileByUeaEmail(member.id)) as db_player
		if (profile) {
			await updateMember(member.id, profile.user_id)

			const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
			if (!guild || !guild.members.me) {
				log.error(`invalid guild in validate members`)
				continue
			}

			await mc_command(`a406fbb6-418d-4160-8611-1c180d33da14`, `lp user ${profile.mc_uuid} promote player`)

			profile.mc_rank = `member`

			await updatePlayerProfile(profile.user_id, profile)

			log.info(`profile: ${profile.mc_username} has been made a member`)
		}
	}
}

export async function fetchTableHtml(): Promise<string | false> {
	const { SU_LOGIN_PAGE, SU_MEMBER_PAGE, SU_USER, SU_PASS } = process.env
	if (!SU_LOGIN_PAGE || !SU_MEMBER_PAGE || !SU_USER || !SU_PASS) throw new Error('Missing environment variables')

	const browser = await puppeteer.launch({ headless: true })
	const page = await browser.newPage()

	try {
		await page.goto(SU_MEMBER_PAGE, { waitUntil: 'networkidle2' })

		if (page.url().includes('login')) {
			log.info('[html graber] Logging in...')
			await page.type('#ctl00_logincontrol_UserName', SU_USER)
			await page.type('#ctl00_logincontrol_Password', SU_PASS)
			await page.click('#ctl00_logincontrol_btnLogin')
			await page.waitForNavigation({ waitUntil: 'networkidle2' })
		}

		await page.goto(SU_MEMBER_PAGE, { waitUntil: 'networkidle2' })
		await page.waitForSelector('table.msl_table')
		const tableHtml = await page.$eval('table.msl_table', (el) => el.outerHTML)

		log.info(`[html graber] grabbed HTML`)

		return tableHtml
	} catch (err) {
		log.info(`CURRENT URL: ${page.url()}`)
		log.info(`PAGE TITLE: ${await page.title()}`)
		log.error(` error: \n${err}`)
		await page.screenshot({ path: 'debug/debug.png', fullPage: true })
		return false
	} finally {
		await browser.close()
	}
}
