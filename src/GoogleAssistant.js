//adapted from https://github.com/googlesamples/assistant-sdk-nodejs/blob/master/google-assistant-grpc/googleassistant.js
'use strict'

const grpc = require('@grpc/grpc-js')
const { OAuth2Client } = require('google-auth-library')
const protoLoader = require('@grpc/proto-loader')
const protos = require('google-proto-files')
const path = require('path')

const credentials = require('../credentials.json')['web']
console.log(credentials)

// Load the proto file
const PROTO_PATH = protos.getProtoPath(
	'assistant/embedded/v1alpha2/embedded_assistant.proto'
)
console.log(path.resolve('node_modules/google-proto-files'))
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
	includeDirs: [path.resolve('node_modules/google-proto-files')],
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
})
const assistantProto =
	grpc.loadPackageDefinition(packageDefinition).google.assistant.embedded
		.v1alpha2

const redirect_uri = `http://localhost:${process.env.PORT}/code`
module.exports = class GoogleAssistant {
	constructor() {
		GoogleAssistant.prototype.endpoint_ = 'embeddedassistant.googleapis.com'
		this.oauth2Client = new OAuth2Client(
			credentials.client_id,
			credentials.client_secret,
			redirect_uri
		)

		// Generate the consent URL
		const authUrl = this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
      prompt: 'consent',
			scope: ['https://www.googleapis.com/auth/assistant-sdk-prototype'],
			redirect_uri
		});

		console.log('Authorize this app by visiting this URL:', authUrl);
		this.locale = 'en-US'
		this.deviceModelId = process.env.DEVICE_MODEL_ID
		this.deviceInstanceId = process.env.DEVICE_INSTANCE_ID
	}
	async createClient() {
		const callCredentials =
			grpc.credentials.createFromGoogleCredential(this.oauth2Client)
		const sslCredentials = grpc.credentials.createSsl()
		const combinedCredentials = grpc.credentials.combineChannelCredentials(
			sslCredentials,
			callCredentials
		)

		const client = new assistantProto.EmbeddedAssistant(
			this.endpoint_,
			combinedCredentials
		)

		return client
	}

	async assist(input) {
		const client = await this.createClient()
		const config = {
			text_query: input,
			debug_config: {
				return_debug_info: true,
			},
			device_config: {
				device_id: this.deviceInstanceId,
				device_model_id: this.deviceModelId,
			},
			audio_out_config: {
				encoding: 1,
				sample_rate_hertz: 16000,
				volume_percentage: 100,
			},
			dialog_state_in: {
				language_code: this.locale,
			},
		}

		// Call the Assist method
		const conversation = client.assist()
		return new Promise((resolve, reject) => {
			let response = {}
			conversation.on('data', (data) => {
				if (data.debug_info || data.dialog_state_out || data.device_action) {
					console.log(data)
				}

				if (data.device_action) {
					response.deviceAction = JSON.parse(
						data.device_action.device_request_json
					)
				} else if (data.dialog_state_out?.supplemental_display_text) {
					console.log(data)
					response.text = data.dialog_state_out.supplemental_display_text
				}
			})
			conversation.on('end', (error) => {
				console.log(error)
				// Response ended, resolve with the whole response.
				resolve(response)
			})
			conversation.on('error', (error) => {
				reject(error)
			})
			conversation.write({ config })
			conversation.end()
		})
	}
}
