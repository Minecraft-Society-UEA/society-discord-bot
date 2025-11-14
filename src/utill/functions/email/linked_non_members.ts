import { transporter } from '~/utill'

export async function emailLinedNonMember(email: string) {
	// urls and some bits in the html email are verables to make them custom and easier to change
	const SERVER_NAME = `UEA Minecraft Society`
	const SUPPORT_EMAIL = process.env.GMAIL_USER as string

	/// sending the email and the emails html code
	await transporter.sendMail({
		from: `"${SERVER_NAME}" <${SUPPORT_EMAIL}>`,
		to: `${email}`,
		subject: 'You have linked but still are not a members',
		html: ``
	})
}
