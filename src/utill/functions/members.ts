import { GuildMember, Role } from 'discord.js'
import puppeteer from 'puppeteer'
import { client } from 'robo.js'
import {
	getAllMembers,
	getAllLinkedMembers,
	clearAllMembers,
	getProfileByUeaEmail,
	updateMember,
	mc_command,
	updatePlayerProfile,
	getSettingByid,
	db_member,
	db_player,
	role_settings,
	log,
	HUB_SERVER_ID
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

			await mc_command(HUB_SERVER_ID, `lp user ${profile.mc_uuid} promote player`)

			profile.mc_rank = `member`

			await updatePlayerProfile(profile.user_id, profile)

			log.info(`profile: ${profile.mc_username} has been made a member`)
		}
	}
}

export async function annualMembershipReset() {
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	if (!guild || !guild.members.me) {
		log.error('Annual reset: guild not found')
		return
	}

	const roles = (await getSettingByid('roles')) as role_settings
	const linked_members = await getAllLinkedMembers()

	log.info(`Annual reset: processing ${linked_members.length} linked members`)

	for (const entry of linked_members) {
		if (!entry.user_id) continue

		try {
			const profile = (await getProfileByUeaEmail(entry.id)) as db_player | null
			if (!profile) continue

			// Demote in LuckPerms
			if (profile.mc_uuid) {
				await mc_command(HUB_SERVER_ID, `lp user ${profile.mc_uuid} parent set verified`).catch((err) =>
					log.warn(`Annual reset: LP rank reset failed for ${profile.mc_username}: ${err}`)
				)
			}

			// Update DB rank
			profile.mc_rank = 'verified'
			await updatePlayerProfile(profile.user_id, profile)

			// Remove Discord member role
			const discord_member = (await guild.members.fetch(profile.user_id).catch(() => null)) as GuildMember | null
			if (
				discord_member &&
				guild.members.me!.roles.highest.comparePositionTo(discord_member.roles.highest) > 0 &&
				discord_member.id !== guild.ownerId
			) {
				await discord_member.roles.remove(guild.roles.cache.get(roles.setting.member) as Role)
			}

			log.msg(`Annual reset: removed member status from ${profile.mc_username ?? entry.user_id}`)
		} catch (err) {
			log.error(`Annual reset: failed to process entry ${entry.id}: ${err}`)
		}
	}

	await clearAllMembers()

	log.info('Annual membership reset complete — player_members table cleared, all member roles removed')
}

export async function fetchTableHtml(): Promise<string | false> {
	const { SU_LOGIN_PAGE, SU_MEMBER_PAGE, SU_USER, SU_PASS } = process.env
	if (!SU_LOGIN_PAGE || !SU_MEMBER_PAGE || !SU_USER || !SU_PASS) {
		log.error(`Missing environment variables`)
		return false
	}

	const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
	const page = await browser.newPage()

	page.setDefaultNavigationTimeout(0)
	page.setDefaultTimeout(0)

	try {
		await page.goto(SU_MEMBER_PAGE, { waitUntil: 'domcontentloaded' })

		if (page.url().includes('login')) {
			log.info('[html grabber] Logging in...')

			await page.type('#ctl00_logincontrol_UserName', SU_USER)
			await page.type('#ctl00_logincontrol_Password', SU_PASS)
			await Promise.allSettled([
				page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 }),
				page.click('#ctl00_logincontrol_btnLogin')
			])
		}
		await Promise.allSettled([
			page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 }),
			page.goto(SU_MEMBER_PAGE)
		])
		const selector = 'table[id^="ctl00_ctl00_Main_AdminPageContent_rptGroups_"][id$="_gvMemberships"]'
		await page.waitForSelector(selector)
		const tableHtml = await page.$eval(selector, (el) => el.outerHTML)
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
