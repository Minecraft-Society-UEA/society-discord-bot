import { logger } from 'robo.js'
import { sql } from '../events/ready'
import { db_bans, db_player, db_warns } from './types'

//function to get and find a user based on diffrent things
export async function getProfileByDId(userId: string) {
	try {
		const playerProfile = await sql<db_player[]>`
        SELECT *
        FROM players
      	WHERE user_id = ${userId}
      `

		if (playerProfile.length > 0) {
			return playerProfile[0]
		} else {
			return false
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return false
	}
}

export async function getProfileByMcUuid(McUuid: string) {
	try {
		const playerProfile = await sql<db_player[]>`
        SELECT *
        FROM players
      	WHERE mc_uuid = ${McUuid}
      `

		if (playerProfile.length > 0) {
			return playerProfile[0]
		} else {
			return false
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return false
	}
}

export async function getProfileByMcUsername(McUsername: string) {
	try {
		const playerProfile = await sql<db_player[]>`
        SELECT *
        FROM players
      	WHERE mc_username = ${McUsername}
      `

		if (playerProfile.length > 0) {
			return playerProfile[0]
		} else {
			return false
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return false
	}
}

export async function getProfileByUeaEmail(Email: string) {
	try {
		const playerProfile = await sql<db_player[]>`
        SELECT *
        FROM players
      	WHERE uea_email = ${Email}
      `

		if (playerProfile.length > 0) {
			return playerProfile[0]
		} else {
			return false
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return false
	}
}

// create a player profile for a discord user
export async function createPlayerProfile(userId: string) {
	const newUser = await sql<db_player[]>`
  INSERT INTO players (user_id) 
  VALUES (${userId}) 
  RETURNING user_id
  `

	if (!newUser.length) return 'Failed to create profile.'
	return newUser[0]
}

// update a profiles details
export async function updatePlayerProfile(did: string, new_playerP: db_player) {
	try {
		if (!new_playerP) return

		const updatedProfile = await sql<db_player[]>`
		UPDATE quiz_guildSettings
		SET 
			uea_email = ${new_playerP.uea_email}, 
			mc_verifid = ${new_playerP.mc_verifid},
			mc_uuid = ${new_playerP.mc_uuid},
			mc_username = ${new_playerP.mc_username},
			mc_rank = ${new_playerP.mc_rank},
			is_member = ${new_playerP.is_member},
			email_verifid = ${new_playerP.email_verifid}
		WHERE user_id = ${did}
		RETURNING *;
		`

		return updatedProfile[0]
	} catch (err) {
		logger.error(`Error updating player profile: ${err} `)
		return false
	}
}

// create a new warning
export async function createWarning(
	userId: string,
	isuer: string,
	reason: string,
	img: string[] = [],
	effectedUsers: string[] = [],
	warnEffectsBans: boolean = true
) {
	try {
		const newWarning = await sql<db_warns[]>`
			INSERT INTO warns (user_id, isuer, reason, img, effected_users, warn_effects_bans)
			VALUES (
				${userId},
				${isuer},
				${reason},
				${sql.json(img)},
				${sql.json(effectedUsers)},
				${warnEffectsBans}
			)
			RETURNING *
		`
		return newWarning[0]
	} catch (err) {
		logger.error(`Error creating warning: ${err}`)
		return null
	}
}

// get all warnings for a specific user_id
export async function getWarningsByUserId(userId: string) {
	try {
		const warnings = await sql<db_warns[]>`
			SELECT *
			FROM warns
			WHERE user_id = ${userId}
			ORDER BY created_at DESC
		`
		return warnings
	} catch (err) {
		logger.error(`Error fetching warnings for user ${userId}: ${err}`)
		return []
	}
}

// get all warnings that effect bans for a specific user_id
export async function getWarningsEffectBansByUserId(userId: string) {
	try {
		const warnings = await sql<db_warns[]>`
			SELECT *
			FROM warns
			WHERE user_id = ${userId} AND warn_effects_bans = true
			ORDER BY created_at DESC
		`
		return warnings
	} catch (err) {
		logger.error(`Error fetching warnings for user ${userId}: ${err}`)
		return []
	}
}

// get warnings where effected_users contains a given user_id
export async function getWarningsByEffectedUser(effectedUserId: string) {
	try {
		const warnings = await sql<db_warns[]>`
			SELECT *
			FROM warns
			WHERE effected_users @> ${sql.json([effectedUserId])}
			ORDER BY created_at DESC
		`
		return warnings
	} catch (err) {
		logger.error(`Error fetching warnings for effected user ${effectedUserId}: ${err}`)
		return []
	}
}

// create a new ban
export async function createBan(userId: string, reason: string, bannedTill: string) {
	try {
		const newBan = await sql<db_bans[]>`
			INSERT INTO bans (user_id, reason, banned_till)
			VALUES (${userId}, ${reason}, ${bannedTill})
			RETURNING *
		`
		return newBan[0]
	} catch (err) {
		logger.error(`Error creating ban: ${err}`)
		return null
	}
}

// get all bans for a specific user_id
export async function getBansByUserId(userId: string) {
	try {
		const bans = await sql<db_bans[]>`
			SELECT *
			FROM bans
			WHERE user_id = ${userId}
			ORDER BY created_at DESC
		`
		return bans
	} catch (err) {
		logger.error(`Error fetching bans for user ${userId}: ${err}`)
		return []
	}
}

// get all bans expiring today
export async function getBansExpiringToday() {
	try {
		// format today's date as DD/MM/YYYY
		const today = new Date()
		const dd = String(today.getDate()).padStart(2, '0')
		const mm = String(today.getMonth() + 1).padStart(2, '0')
		const yyyy = today.getFullYear()
		const todayStr = `${dd}/${mm}/${yyyy}`

		const expiringBans = await sql<db_bans[]>`
			SELECT *
			FROM bans
			WHERE banned_till = ${todayStr}
			ORDER BY created_at DESC
		`
		return expiringBans
	} catch (err) {
		logger.error(`Error fetching expiring bans: ${err}`)
		return []
	}
}

// expire old warnings (older than 1 year) so they no longer count toward bans
export async function expireOldWarnings() {
	try {
		const expiredWarnings = await sql<db_warns[]>`
			UPDATE warns
			SET warn_effects_bans = false
			WHERE warn_effects_bans = true
			  AND created_at < NOW() - INTERVAL '1 year'
			RETURNING *
		`

		return expiredWarnings
	} catch (err) {
		logger.error(`Error expiring old warnings: ${err}`)
		return []
	}
}
