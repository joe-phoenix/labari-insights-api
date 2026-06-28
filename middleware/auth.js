const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split('Bearer ')[1]

  if (!token) {
    req.user = null
    req.tier = 'public'
    return next()
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    req.user = null
    req.tier = 'public'
    return next()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  req.user = user
  req.tier = profile?.tier || 'free'
  next()
}

module.exports = authenticate
