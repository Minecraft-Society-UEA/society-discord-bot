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
