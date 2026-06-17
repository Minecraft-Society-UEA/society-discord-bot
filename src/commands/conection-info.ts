import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'

const CONNECTION_INFO = `# **How to join our community Minecraft server!**
> ## ✦ **To gain full access to the server you must [→ verify your Minecraft account](https://discord.com/channels/1403421910557130842/1415612281022189578)**
## <:grass:1424050944194383892>  __Java Connection:__
Enter this address after clicking the \`Add Server\` button under the **Multiplayer** tab.
**Server Address:**
> \`\`\`play.ueamcsociety.net\`\`\`
We recommend that you join on \`1.21.10\` for the best experience as of \`29-12-2025\`
-# You must be in any version above 1.13 to join.
## <:bedrock:1485314220495998977>  __Bedrock Connection (Mobile/PC/XBOX):__
Connect by going to the **Servers** tab and clicking →  \`Add Server\` then fill in the details below
**Server Address:**
> \`\`\`play-br.ueamcsociety.net\`\`\`
> **Port:** \`35504\`
## <:sony_playstation:1404261256575189072>  __PS4/5 Bedrock Connection__
> ### **__STEP 1__**
> Download one of these apps →
> - Bedrock Together (IOS, Android)
> - Phantom (PC CLI)
> - MC LAN Proxy (Android)
> ### **__STEP 2__**
> Enter the bedrock server details (listed above) in the app.
> ### **__STEP 3__**
> On your PlayStation, open Minecraft → friends tab → LAN section → join.
### ✦ Make sure you have \`Visible to LAN Players\` enabled in multiplayer settings.`

export const config = createCommandConfig({
	description: 'Show server connection details for Java, Bedrock, and PS4/5',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall']
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel('Become a Member')
			.setURL('https://www.ueasu.org/communities/societies/group/minecraft')
			.setStyle(ButtonStyle.Link)
			.setEmoji('🌟'),
		new ButtonBuilder()
			.setLabel('Verify Guide')
			.setURL('https://discord.com/channels/1403421910557130842/1415612281022189578')
			.setStyle(ButtonStyle.Link)
			.setEmoji('✅'),
		new ButtonBuilder()
			.setLabel('Modpack Guide')
			.setURL('https://discord.com/channels/1403421910557130842/1469767108760961076')
			.setStyle(ButtonStyle.Link)
			.setEmoji('📦')
	)

	return { content: CONNECTION_INFO, components: [row] }
}
