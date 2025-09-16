import { ColorResolvable } from 'discord.js'

// the type the /login endpoint returns
export type token = {
	token: string
}

// the type the /players endpoint returns a array of
export type player = {
	level: number
	name: string
	health: number
	uuid: string
	gamemode: string
}

// the type the /players endpoint returns
export type connected_players = {
	max_players: number
	online_players: player[]
}

// server key type
export type ServerKey = 'hub' | 'survival' | 'creative' | 'event'

// the type of the worlds array the server info returns
export type world = {
	name: string
	player_count: number
	time: number
	weather: string
}

export type server_details = {
	port: string
	token: string
}

//the type /server/info returns
export type server_info = {
	version: string
	bukkit_version: string
	server_name: string
	online_mode: boolean
	max_players: number
	current_players: number
	worlds: world[]
}

// the type gettokens returns
export type tokens = {
	hub: string
	survival: string
	creative: string
	event: string
}

// mc rank type or what ranks a player can be
export type mc_rank_type = 'unverified' | 'verified' | 'member' | 'tester' | 'admin'

//the type of the player profiles stored in the Database
export type db_player = {
	user_id: string
	uea_email: string | null
	mc_username: string | null
	mc_uuid: string | null
	mc_rank: mc_rank_type
	mc_verifid: boolean
	email_verifid: boolean
	is_member: boolean
	created_at: string
}

// type of player warnings in the db
export type db_warns = {
	warn_id: string
	user_id: string
	reason: string
	img?: string[]
	effected_users?: string[]
	warn_effects_bans: boolean
	created_at: string
}

// type of player mc bans in db
export type db_bans = {
	ban_id: string
	user_id: string
	reason: string
	banned_till: number
	created_at: string
}

//the type /server/command returns
export type return_command = {
	success: boolean
	message: string
}

// what the check member status function returns
export type check_member_return = {
	message: string
	colour: ColorResolvable
}

// all player list from every server
export type all_player_list = {
	hub: connected_players
	survival: connected_players
	creative: connected_players
	event: connected_players
	total_online: number
	all_players: player[]
}

export type role_storage = {
	mc_verified: string
	member: string
	tester: string
}

export type UploadResponse = {
	success: boolean
	statusCode: number
	timestamp: string
	timeMs: number
	data?: {
		id?: string
		user_id: string
		created: string
		file_name: string
		expires_at: string | null
	}
}
