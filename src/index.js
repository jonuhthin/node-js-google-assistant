const GoogleAssistant = require('./GoogleAssistant')
const express = require('express')

// Initialize Express server
const app = express()
const PORT = process.env.PORT

const client = new GoogleAssistant()
app.use(express.json())

app.get('/code', async (req, res) => {
	console.log(req.query.code)
	process.env.AUTHORIZATION_CODE = req.query.code
	res.set('Content-Type', 'text/html');
	res.status(200).send(Buffer.from('<p>You can now close this window.</p>'))
	const { tokens } = await client.oauth2Client.getToken(req.query.code)
	client.oauth2Client.setCredentials(tokens)
	console.log('app is now authorized!')
})

app.post('/assist', async (req, res) => {
	if (!req.body.input) {
		res.status(404).json({ error: 'must provide input value' })
		res.send()
	} else {
		try {
			const resp = await client.assist(req.body.input)
			res.json({ response: resp, requestBody: req.body })
		} catch (err) {
			console.log(err)
			res.status(500).json(err)
		}
	}
})

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`)
})
