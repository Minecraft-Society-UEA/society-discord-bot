// the type the /players endpoint returns a array of for the fabric servsers
export type fabric_players = {
	players: fabric_player[]
}

// the player type
export type fabric_player = {
	name: string
	uuid: string
}

// the type the postion of the player is stored as
export type pos = {
	x: number
	y: number
	z: number
}
