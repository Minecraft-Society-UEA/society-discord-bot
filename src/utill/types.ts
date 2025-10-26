import { ColorResolvable, HexColorString } from 'discord.js'

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

// the type of the worlds array the server info returns
export type world = {
	name: string
	player_count: number
	time: number
	weather: string
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

// mc rank type or what ranks a player can be
export type mc_rank_type = 'unverified' | 'verified' | 'member' | 'tester' | 'admin'

//the type of the player profiles stored in the Databaseastari
export type db_player = {
	user_id: string
	uea_email: string | null
	mc_username: string | null
	bed_mc_username: string | null
	mc_uuid: string | null
	mc_rank: mc_rank_type
	is_member: boolean
	created_at: string
}

export type db_online_player = {
	uuid: string
	name: string
	level: number
	health: number
	gamemode: string
	server: string
}

// type of player warnings in the db
export type db_warns = {
	warn_id: string
	user_id: string
	issuer: string
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

export type db_server = {
	id: string
	name: string
	emoji: string
	host: string
	game_port: string
	port: string
	user: string
	pass: string
	currently_online: number
	players: player[]
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
	server_players: { id: string; players: player[] }[]
	total_online: number
	all_players: player[]
}

// roles being stored
export type role_storage = {
	mc_verified: string
	email_verified: string
	member: string
	tester: string
	unverified: string
	committee: string
}

// array of kv for embed in double check : keep its modular
export type checksarr = {
	key: string
	value: string
}

// settings for the welcome message
export type welcome_settings = {
	channelid: string
	title: string
	colourhex: HexColorString
	path: string
}

export type setting_return = {
	setting: any
}
