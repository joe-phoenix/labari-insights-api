const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')

const BASEROW_TOKEN = process.env.BASEROW_API_TOKEN
const TABLE_ID = process.env.BASEROW_COMPANIES_TABLE_ID
const PUBLIC_LIMIT = 15

async function fetchFromBaserow() {
  const response = await fetch(
    `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/?user_field_names=true&size=200&order_by=Name`,
    {
      headers: { Authorization: `Token ${BASEROW_TOKEN}` }
    }
  )
  if (!response.ok) throw new Error('Baserow fetch failed')
  const data = await response.json()
  return data.results
}

// GET /api/companies
router.get('/', authenticate, async (req, res) => {
  try {
    const all = await fetchFromBaserow()

    // Paid users — return everything
    if (req.tier === 'paid') {
      return res.json({
        companies: all,
        total: all.length,
        visible: all.length,
        locked_count: 0,
        tier: 'paid'
      })
    }

    // Public + free — 15 visible, rest as stubs
    const visible = all.slice(0, PUBLIC_LIMIT)
    const locked = all.slice(PUBLIC_LIMIT).map(c => ({
      id: c.id,
      locked: true
    }))

    res.json({
      companies: visible,
      locked,
      total: all.length,
      visible: visible.length,
      locked_count: locked.length,
      tier: req.tier
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch companies' })
  }
})

// GET /api/companies/:id — paid only
router.get('/:id', authenticate, async (req, res) => {
  if (req.tier !== 'paid') {
    return res.status(403).json({
      error: 'Upgrade to access company details',
      upgrade_required: true
    })
  }

  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/${req.params.id}/?user_field_names=true`,
      { headers: { Authorization: `Token ${BASEROW_TOKEN}` } }
    )
    const company = await response.json()
    res.json(company)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' })
  }
})

module.exports = router
