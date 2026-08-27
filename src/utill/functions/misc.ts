// Returns true between July 31st and August 19th (inclusive) — membership renewal blackout period
export function isMembershipPaused(): boolean {
	const now = new Date()
	const month = now.getMonth() + 1
	const day = now.getDate()
	return (month === 7 && day >= 31) || (month === 8 && day < 20)
}

// a function to generate a 5 digit long code for verification
export function generateCode(length = 5) {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789'
	let code = ''
	for (let i = 0; i < length; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return code
}

// Format playtime seconds to human-readable format (Xd Yh Zm)
export function formatPlaytime(seconds: number | bigint): string {
	const totalSeconds = typeof seconds === 'bigint' ? Number(seconds) : seconds
	const days = Math.floor(totalSeconds / 86400)
	const hours = Math.floor((totalSeconds % 86400) / 3600)
	const mins = Math.floor((totalSeconds % 3600) / 60)
	return `${days}d ${hours}h ${mins}m`
}
