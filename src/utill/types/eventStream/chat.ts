export type global_chat = {
	playerName: string
	playerUuid: string
	message: string
	factionId?: string
	factionName?: string
	factionColor?: string
}

export type faction_chat = {
	factionId: string
	factionName: string
	factionColor: string
	playerName: string
	playerUuid: string
	message: string
}
