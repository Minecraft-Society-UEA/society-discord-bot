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
	if (!SU_LOGIN_PAGE || !SU_MEMBER_PAGE || !SU_USER || !SU_PASS) {
		log.error(`Missing environment variables`)
		return false
	}

	const browser = await puppeteer.launch({ headless: true })
	const page = await browser.newPage()

	page.setDefaultNavigationTimeout(0)
	page.setDefaultTimeout(0)

	try {
		await page.goto(SU_MEMBER_PAGE, { waitUntil: 'domcontentloaded' })

		if (page.url().includes('login')) {
			log.info('[html grabber] Logging in...')

			await page.type('#ctl00_logincontrol_UserName', SU_USER)
			await page.type('#ctl00_logincontrol_Password', SU_PASS)
			console.log(1)
			await Promise.allSettled([
				page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 }),
				page.click('#ctl00_logincontrol_btnLogin')
			])
		}
		console.log(2)
		await Promise.allSettled([
			page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 }),
			page.goto(SU_MEMBER_PAGE)
		])
		console.log(3)
		const selector = 'table[id^="ctl00_ctl00_Main_AdminPageContent_rptGroups_"][id$="_gvMemberships"]'
		console.log(4)
		await page.waitForSelector(selector)
		console.log(5)
		const tableHtml = await page.$eval(selector, (el) => el.outerHTML)
		console.log(6)
		log.info('[html grabber] grabbed HTML')
		return tableHtml
	} catch (err) {
		const date = new Date()
		log.info(`CURRENT URL: ${page.url()}`)
		log.info(`PAGE TITLE: ${await page.title().catch(() => '[failed]')}`)
		log.error(`fetchTableHtml error:\n${err}`)
		await page.screenshot({ path: `debug/${date}.png`, fullPage: true })
		return false
	} finally {
		await browser.close()
	}
}
