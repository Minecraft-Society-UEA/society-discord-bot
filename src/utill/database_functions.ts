import { logger } from 'robo.js'
import { sql } from '../events/ready'
import { db_player } from './types'

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
			return `error`
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return `error`
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
			return `error`
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return `error`
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
			return `error`
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return `error`
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
			return `error`
		}
	} catch (err) {
		logger.error(`Error fetching user profile:\n\n ${err}`)
		return `error`
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
		return `error`
	}
}
