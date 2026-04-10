// the type the /players endpoint returns a array of for the fabric servsers
export type fabric_players = {
	count: number
	players: fabric_player[]
}

// the player type
export type fabric_player = {
	name: string
	uuid: string
	health: number
	food_level: number
	position: pos
	dimension: string
	ping_ms: number
	game_mode: string
	is_op: boolean
	skin_head_url: string
}

// the type the postion of the player is stored as
export type pos = {
	x: number
	y: number
	z: number
}
