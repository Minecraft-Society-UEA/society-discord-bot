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
	online_players?: player[]
}

// all player list from every server
export type all_player_list = {
	server_players: { id: string; players: player[] }[]
	total_online: number
	all_players: player[]
}
