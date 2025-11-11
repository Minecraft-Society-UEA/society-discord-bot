import { CommandOption } from 'robo.js'

export const servers_req = {
	name: 'server',
	description: 'pick the target server',
	type: `string`,
	choices: [
		{
			name: `Hub`,
			value: `a406fbb6-418d-4160-8611-1c180d33da14`
		},
		{
			name: `SMP1`,
			value: `ca3cf618-b941-478c-b056-fedd9ba9f1f0`
		},
		{
			name: `SMP2`,
			value: `c72abfc4-c6bd-4148-a7aa-213e32aaa578`
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
			value: `a406fbb6-418d-4160-8611-1c180d33da14`
		},
		{
			name: `SMP1`,
			value: `ca3cf618-b941-478c-b056-fedd9ba9f1f0`
		},
		{
			name: `SMP2`,
			value: `c72abfc4-c6bd-4148-a7aa-213e32aaa578`
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
