const deviceCredentials = require('../credentials.json')
const GoogleAssistant = require('./GoogleAssistant')
const express = require('express')

// Initialize Express server
const app = express()
const PORT = process.env.PORT

app.use(express.json())
app.post('/assist', async (req, res) => {
	const client = new GoogleAssistant(deviceCredentials)
	if (!req.body.input) {
		res.status(404).json({ error: 'must provide input value' })
		res.send()
	} else {
		const resp = await client.assist(req.body.input)
		res.json({ response: resp, requestBody: req.body })
	}
})

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`)
})
