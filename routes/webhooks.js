const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify signature — confirms this is genuinely from Paystack
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex')

  if (hash !== req.headers['x-paystack-signature']) {
    console.warn('Invalid Paystack signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = JSON.parse(req.body)
  console.log('Paystack event received:', event.event)

  if (event.event === 'charge.success') {
    const email = event.data.customer.email

    // Find the user in Supabase by email
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === email)

    if (user) {
      await supabase
        .from('profiles')
        .update({
          tier: 'paid',
          paystack_customer_code: event.data.customer.customer_code
        })
        .eq('id', user.id)

      console.log(`Upgraded ${email} to paid`)
    } else {
      console.log(`No Supabase user found for email: ${email}`)
    }
  }

  res.sendStatus(200)
})

module.exports = router
