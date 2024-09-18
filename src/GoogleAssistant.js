//adapted from https://github.com/googlesamples/assistant-sdk-nodejs/blob/master/google-assistant-grpc/googleassistant.js
'use strict'

const grpc = require('@grpc/grpc-js')
const auth = require('google-auth-library')
const protoLoader = require('@grpc/proto-loader')
const protos = require('google-proto-files')
const path = require('path')

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

module.exports = class GoogleAssistant {
	constructor(credentials) {
		GoogleAssistant.prototype.endpoint_ = 'embeddedassistant.googleapis.com'
		this.client = this.createClient_(credentials)
		this.locale = 'en-US'
		this.deviceModelId = process.env.DEVICE_MODEL_ID
		this.deviceInstanceId = process.env.DEVICE_INSTANCE_ID
	}
	createClient_(credentials) {
		const refreshCredentials = new auth.UserRefreshClient(
			credentials.client_id,
			credentials.client_secret,
			credentials.refresh_token
		)
		const callCredentials =
			grpc.credentials.createFromGoogleCredential(refreshCredentials)
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
		const conversation = this.client.assist()
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
