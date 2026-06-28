require('dotenv').config()
const express = require('express')
const cors = require('cors')
const companiesRoute = require('./routes/companies')
const webhooksRoute = require('./routes/webhooks')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://insights.techlabari.com',
    'https://joe-phoenix.github.io'
  ]
}))

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'labari-insights-api' })
})

app.use('/api/companies', companiesRoute)
app.use('/webhooks', webhooksRoute)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Labari Insights API running on port ${PORT}`)
})
