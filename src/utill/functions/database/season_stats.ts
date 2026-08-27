import { db_season_stats, log } from '~/utill'
import { pool } from './pool'
import { getSettingByid, updateSettings } from './setting'

const DEFAULT_SEASON = 'season_1'

export async function getCurrentSeason(): Promise<string> {
	const row = await getSettingByid('season')
	return row?.setting?.current ?? DEFAULT_SEASON
}

// bumps season_1 -> season_2 etc, called from the annual reset
export async function advanceSeason(): Promise<string> {
	const current = await getCurrentSeason()
	const match = current.match(/^season_(\d+)$/)
	const next = match ? `season_${parseInt(match[1], 10) + 1}` : DEFAULT_SEASON
	await updateSettings('season', { current: next })
	return next
}

export async function addPlaytime(userId: string, seconds: number) {
	if (seconds <= 0) return
	try {
		const season = await getCurrentSeason()
		await pool.query(
			`INSERT INTO season_stats (user_id, season, playtime_seconds, messages_sent)
			 VALUES (?, ?, ?, 0)
			 ON DUPLICATE KEY UPDATE playtime_seconds = playtime_seconds + ?`,
			[userId, season, seconds, seconds]
		)
	} catch (err) {
		log.error(`Error adding playtime for ${userId}: ${err}`)
	}
}

export async function incrementMessageCount(userId: string) {
	try {
		const season = await getCurrentSeason()
		await pool.query(
			`INSERT INTO season_stats (user_id, season, playtime_seconds, messages_sent)
			 VALUES (?, ?, 0, 1)
			 ON DUPLICATE KEY UPDATE messages_sent = messages_sent + 1`,
			[userId, season]
		)
	} catch (err) {
		log.error(`Error incrementing message count for ${userId}: ${err}`)
	}
}

export async function getSeasonStatsByUserId(userId: string) {
	try {
		return await pool.query<db_season_stats[]>('SELECT * FROM season_stats WHERE user_id = ? ORDER BY season DESC', [
			userId
		])
	} catch (err) {
		log.error(`Error fetching season stats for ${userId}: ${err}`)
		return []
	}
}

export async function getSeasonLeaderboard(
	season: string,
	metric: 'playtime_seconds' | 'messages_sent',
	limit: number = 10
) {
	const column = metric === 'messages_sent' ? 'messages_sent' : 'playtime_seconds'
	try {
		return await pool.query<(db_season_stats & { mc_username: string | null })[]>(
			`SELECT ss.*, p.mc_username FROM season_stats ss
			 JOIN players p ON p.user_id = ss.user_id
			 WHERE ss.season = ?
			 ORDER BY ss.${column} DESC
			 LIMIT ?`,
			[season, limit]
		)
	} catch (err) {
		log.error(`Error fetching season leaderboard: ${err}`)
		return []
	}
}
