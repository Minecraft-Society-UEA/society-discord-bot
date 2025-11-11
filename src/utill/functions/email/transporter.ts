import nodemailer from 'nodemailer'

// the user and pass for the smtp server
const user = process.env.GMAIL_USER as string
const pass = process.env.GMAIL_PASS as string

// the transporter nodmalier object to connect to the smtp server
export const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: user,
		pass: pass
	}
})
