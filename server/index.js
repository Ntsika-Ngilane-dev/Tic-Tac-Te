import 'dotenv/config'
import dotenv from 'dotenv'
import crypto from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { MongoClient } from 'mongodb'
import { OAuth2Client } from 'google-auth-library'

dotenv.config({ path: 'atlas-credentials.env' })

const app = express()
const port = Number(process.env.API_PORT || 3001)
const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const sessionSecret = process.env.SESSION_SECRET || ''
const sessionCookieName = 'ttt_session'
const sessionDurationSeconds = 7 * 24 * 60 * 60
const googleClient = new OAuth2Client(googleClientId)
const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(serverDirectory, '..')
let mongoClientPromise

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

function getPlayersCollection() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MongoDB is not configured')
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(uri)
    mongoClientPromise = client.connect().catch((error) => {
      mongoClientPromise = undefined
      throw error
    })
  }

  return mongoClientPromise.then((client) =>
    client.db(process.env.MONGODB_DB || 'tic_tac_toe').collection('players'),
  )
}

function defaultProfile() {
  return {
    name: 'Astra',
    stats: { wins: 0, draws: 0, losses: 0 },
    streak: { current: 0, best: 0 },
    money: 80,
    career: { currentMission: 0, completed: [], xp: 0, level: 1 },
    settings: { aiDifficulty: 'medium' },
    inventory: ['classic'],
    unlockedBackgrounds: ['classic'],
    selectedBackground: 'classic',
  }
}

function safeCount(value, fallback = 0) {
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback
}

function sanitizeProfile(value) {
  const defaults = defaultProfile()
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults
  }

  const difficulty = ['easy', 'medium', 'hard'].includes(value.settings?.aiDifficulty)
    ? value.settings.aiDifficulty
    : defaults.settings.aiDifficulty

  return {
    name: typeof value.name === 'string' ? value.name.slice(0, 20) : defaults.name,
    stats: {
      wins: safeCount(value.stats?.wins),
      draws: safeCount(value.stats?.draws),
      losses: safeCount(value.stats?.losses),
    },
    streak: {
      current: safeCount(value.streak?.current),
      best: safeCount(value.streak?.best),
    },
    money: safeCount(value.money, defaults.money),
    career: {
      currentMission: safeCount(value.career?.currentMission),
      completed: Array.isArray(value.career?.completed)
        ? value.career.completed.filter((item) => typeof item === 'string').slice(0, 100)
        : [],
      xp: safeCount(value.career?.xp),
      level: Math.max(1, safeCount(value.career?.level, 1)),
    },
    settings: { aiDifficulty: difficulty },
    inventory: Array.isArray(value.inventory)
      ? value.inventory.filter((item) => typeof item === 'string').slice(0, 1000)
      : defaults.inventory,
    unlockedBackgrounds: Array.isArray(value.unlockedBackgrounds)
      ? value.unlockedBackgrounds.filter((item) => typeof item === 'string').slice(0, 100)
      : defaults.unlockedBackgrounds,
    selectedBackground: typeof value.selectedBackground === 'string'
      ? value.selectedBackground.slice(0, 80)
      : defaults.selectedBackground,
  }
}

function signSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

function readSession(token) {
  if (!token || !sessionSecret) {
    return null
  }

  const [encodedPayload, providedSignature] = token.split('.')
  if (!encodedPayload || !providedSignature) {
    return null
  }

  const expectedSignature = crypto.createHmac('sha256', sessionSecret).update(encodedPayload).digest()
  let actualSignature
  try {
    actualSignature = Buffer.from(providedSignature, 'base64url')
  } catch {
    return null
  }

  if (actualSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(actualSignature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
    return payload.sub && payload.exp > Date.now() ? payload : null
  } catch {
    return null
  }
}

function getCookie(request, name) {
  const cookies = request.headers.cookie?.split(';') || []
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null
}

function setSessionCookie(response, player) {
  const token = signSession({
    sub: player.sub,
    email: player.email,
    name: player.name,
    exp: Date.now() + sessionDurationSeconds * 1000,
  })
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${sessionDurationSeconds}${secure}`,
  )
}

function requireSession(request, response, next) {
  const session = readSession(getCookie(request, sessionCookieName))
  if (!session) {
    response.status(401).json({ error: 'Sign in with Google to access cloud saves.' })
    return
  }

  request.player = session
  next()
}

app.get('/api/config', (_request, response) => {
  response.json({
    googleClientId,
    cloudReady: Boolean(googleClientId && sessionSecret.length >= 32 && process.env.MONGODB_URI),
  })
})

app.post('/api/auth/google', async (request, response, next) => {
  try {
    if (!googleClientId || sessionSecret.length < 32 || !process.env.MONGODB_URI) {
      response.status(503).json({ error: 'Google sign-in and cloud saves are not configured on the server.' })
      return
    }

    const { credential, guestProfile } = request.body || {}
    if (typeof credential !== 'string' || credential.length > 10000) {
      response.status(400).json({ error: 'A valid Google credential is required.' })
      return
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId })
    const claims = ticket.getPayload()
    if (!claims?.sub || !claims.email || claims.email_verified !== true) {
      response.status(401).json({ error: 'Google account verification failed.' })
      return
    }

    const players = await getPlayersCollection()
    const now = new Date()
    await players.updateOne(
      { _id: claims.sub },
      {
        $set: { email: claims.email, displayName: claims.name || claims.email, updatedAt: now },
        $setOnInsert: { profile: sanitizeProfile(guestProfile), createdAt: now },
      },
      { upsert: true },
    )

    const storedPlayer = await players.findOne({ _id: claims.sub })
    setSessionCookie(response, { sub: claims.sub, email: claims.email, name: claims.name || claims.email })
    response.json({
      player: { email: claims.email, name: claims.name || claims.email },
      profile: sanitizeProfile(storedPlayer?.profile),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', (_request, response) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure}`)
  response.status(204).end()
})

app.get('/api/auth/session', async (request, response, next) => {
  const session = readSession(getCookie(request, sessionCookieName))
  if (!session) {
    response.json({ authenticated: false })
    return
  }

  try {
    const players = await getPlayersCollection()
    const player = await players.findOne({ _id: session.sub })
    if (!player) {
      response.json({ authenticated: false })
      return
    }

    response.json({
      authenticated: true,
      player: { email: session.email, name: session.name },
      profile: sanitizeProfile(player.profile),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/player', requireSession, async (request, response, next) => {
  try {
    const players = await getPlayersCollection()
    const player = await players.findOne({ _id: request.player.sub })
    if (!player) {
      response.status(404).json({ error: 'Player profile was not found.' })
      return
    }

    response.json({
      player: { email: request.player.email, name: request.player.name },
      profile: sanitizeProfile(player.profile),
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/player', requireSession, async (request, response, next) => {
  try {
    if (!request.body?.profile || typeof request.body.profile !== 'object') {
      response.status(400).json({ error: 'A player profile is required.' })
      return
    }

    const players = await getPlayersCollection()
    const profile = sanitizeProfile(request.body.profile)
    await players.updateOne(
      { _id: request.player.sub },
      { $set: { profile, updatedAt: new Date() } },
    )
    response.json({ saved: true })
  } catch (error) {
    next(error)
  }
})

const distDirectory = path.join(projectDirectory, 'dist')
if (existsSync(distDirectory)) {
  app.use(express.static(distDirectory))
  app.get(/.*/, (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next()
      return
    }
    response.sendFile(path.join(distDirectory, 'index.html'))
  })
}

app.use((error, _request, response, _next) => {
  console.error('API request failed')
  response.status(500).json({ error: 'The request could not be completed.' })
})

app.listen(port, () => {
  console.log(`Tic Tac Toe API listening on port ${port}`)
})
