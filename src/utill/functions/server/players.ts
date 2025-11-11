import {
	db_online_player,
	db_server,
	getPlayersByName,
	getPlayersByServer,
	getServerByID,
	player,
	connected_players
} from '~/utill'

// a function to get all online players across all servers
export async function getPlayerList(serverid: string): Promise<connected_players | undefined> {
	const server = (await getServerByID(serverid)) as db_server
	const connected_players = {} as connected_players
	const players = (await getPlayersByServer(serverid)) as player[]

	connected_players.max_players = 300
	connected_players.online_players = players

	return connected_players
}

// check if player is online and returns what server there in
export async function online_server_check(mc_name: string) {
	const player = (await getPlayersByName(mc_name)) as db_online_player
	if (!player) return false
	return player ? player.server : false
}
