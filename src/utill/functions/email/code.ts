import { transporter } from '~/utill'

export async function emailCode(email: string, code: string, username: string) {
	const VERIFICATION_CODE = code
	const NAME = username
	const SUPPORT_EMAIL = process.env.GMAIL_USER as string

	const plainText = `UEA Minecraft Society\nHey ${NAME},\n${VERIFICATION_CODE}\n\nHope to see you on the server soon!\n\nThe MCSOC Team`

	const gmailHtml = `<div dir="ltr"><div style="color:rgb(196,196,196);font-family:sans-serif;display:flex"><div style="font-size:14px;font-weight:600;letter-spacing:-0.5px"><br class="gmail-Apple-interchange-newline">UEA Minecraft Society</div></div><h3 style="color:rgb(23,22,21);font-family:sans-serif;margin:30px 0px 10px;font-size:1.5rem;font-weight:500">Hey ${NAME},</h3><div style="color:rgb(200,195,188);font-family:sans-serif;text-align:center"><div style="background:rgb(241,241,241);color:rgb(23,22,21);display:inline-block;border-radius:12px;padding:15px 20px;margin:10px;font-size:40px;letter-spacing:2px">${VERIFICATION_CODE}</div><div class="gmail-adL" style="scrollbar-color: rgb(69, 74, 77) rgb(32, 35, 36);"></div></div><div class="gmail-adL" style="color:rgb(200,195,188);font-family:sans-serif"><div class="gmail-adm" style="margin:5px 0px"></div><div class="gmail-im" style="color:inherit"><p style="margin:0px 0px 10px;font-size:14px">Hope to see you on the server soon!</p><p style="color:rgb(152,152,152);font-size:12px;margin:0px">The MCSOC Team</p></div></div></div>`

	await transporter.sendMail({
		from: `"Minecraft Society UEA" <${SUPPORT_EMAIL}>`,
		to: `${email}`,
		subject: 'Your verification code for the UEA Minecraft server',
		text: plainText,
		html: gmailHtml
	})
}
