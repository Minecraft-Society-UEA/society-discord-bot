import { CommandOption } from 'robo.js'

export const servers_req = {
	name: 'server',
	description: 'pick the target server',
	type: `string`,
	choices: [
		{
			name: `Hub`,
			value: `31b0d944`
		},
		{
			name: `SMP`,
			value: `a814b3bd`
		},
		{
			name: `Creative`,
			value: `8dbb710c-c181-4cb4-a236-f2dec3bd08e6`
		},
		{
			name: `OLD SMPs`,
			value: `094a4a23-d454-4d3e-9c14-7432e12089cb`
		},
		{
			name: `Event HG`,
			value: `6d75e064-dec0-4213-951a-bf265be15854`
		}
	],
	required: true
} as CommandOption

export const servers_non_req = {
	name: 'server',
	description: 'pick the target server',
	type: `string`,
	choices: [
		{
			name: `Hub`,
			value: `31b0d944`
		},
		{
			name: `SMP`,
			value: `a814b3bd`
		},
		{
			name: `Factions`,
			value: `bd04a936`
		},
		{
			name: `Event Spleef`,
			value: `c77745c3`
		}
	],
	required: true
} as CommandOption
