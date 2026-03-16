import { transporter } from '~/utill'

export async function emailCode(email: string, code: string, username: string) {
	// urls and some bits in the html email are verables to make them custom and easier to change
	const VERIFICATION_CODE = code
	const SERVER_NAME = `UEA Minecraft Society`
	const NAME = username
	const SUPPORT_EMAIL = process.env.GMAIL_USER as string


	/// sending the email and the emails html code
	await transporter.sendMail({
		from: `"${SERVER_NAME}" <${SUPPORT_EMAIL}>`,
		to: `${email}`,
		subject: 'UEA Minecraft Society',
		html: `
<html lang="en">

<head>
</head>

<body style="margin:0; padding:20px 20px 20px 20px; font-family:sans-serif; color:#333;">

	<div style="max-width:450px; margin:50px auto; padding:20px 35px 20px 35px; background:#fff; border:1px solid #dddddd; border-radius:12px; box-shadow:0 2px 20px rgba(0,0,0,0.05); position:relative;">

		<h3 style="margin:30px 0 10px; font-size:1.5rem; font-weight:500; color:#171615;">
			Hey ${NAME},
		</h3>

		<div style="text-align:center;">
			<div style="display:inline-block; text-align:center; background:#f1f1f1; border-radius:12px; padding:15px 20px; margin:10px; font-size:40px; font-weight:400; color:#171615; letter-spacing:2px; font-family:sans-serif;">
				${VERIFICATION_CODE}
			</div>
		</div>

		<p style="margin:0 0 10px 0; font-size:14px; font-weight:500;">
			Hope to see you on the server soon!
		</p>

		<p style="font-size:12px; color:#989898; margin:0;">
			The MCSOC Team
		</p>
		<p></p>
	</div>

</body>

</html>
`
	})
}
