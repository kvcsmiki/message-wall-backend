//import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!
)

const JWT_SECRET = process.env.JWT_SECRET!
const allowedOrigins = [
    'https://message-wall-frontend.vercel.app',
]

export default async function handler(req: any, res: any) {
    const origin = req.headers.origin

    // --- CORS ---
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

    // --- Preflight OPTIONS ---
    if (req.method === 'OPTIONS') return res.status(200).end()

    const url = req.url || ''

    try {
        // REGISTER
        if (url.endsWith('/register') && req.method === 'POST') {
            const { email, password } = req.body as { email: string; password: string }
            const hashed = await bcrypt.hash(password, 10)
            await supabase.from('users').insert({ email, password: hashed })
            return res.json({ success: true })
        }

        // LOGIN
        if (url.endsWith('/login') && req.method === 'POST') {
            const { email, password } = req.body as { email: string; password: string }
            const { data } = await supabase.from('users').select().eq('email', email).single()
            if (!data) return res.status(401).json({ error: 'User not found' })
            const match = await bcrypt.compare(password, data.password)
            if (!match) return res.status(401).json({ error: 'Wrong password' })

            const token = jwt.sign({ id: data.id }, JWT_SECRET, { expiresIn: '1h' })
            return res.json({ token })
        }

        // GET MESSAGES
        if (url.endsWith('/messages') && req.method === 'GET') {
            const { data } = await supabase.from('messages').select('*').order('id', { ascending: false })
            return res.json(data)
        }

        // POST MESSAGE
        if (url.endsWith('/messages') && req.method === 'POST') {
            const auth = req.headers.authorization?.split(' ')[1]
            if (!auth) return res.status(401).json({ error: 'No token' })
            const decoded = jwt.verify(auth, JWT_SECRET) as { id: number }
            const { content } = req.body as { content: string }
            await supabase.from('messages').insert({ user_id: decoded.id, content })
            return res.json({ success: true })
        }

        // DELETE MESSAGE
        if (url.startsWith('/api/messages/') && req.method === 'DELETE') {
            const auth = req.headers.authorization?.split(' ')[1]
            if (!auth) return res.status(401).json({ error: 'No token' })
            const decoded = jwt.verify(auth, JWT_SECRET) as { id: number }
            const id = url.split('/').pop()
            await supabase.from('messages').delete().eq('id', id).eq('user_id', decoded.id)
            return res.json({ success: true })
        }

        return res.status(404).json({ error: 'Not found' })
    } catch (err: any) {
        return res.status(500).json({ error: err.message })
    }
}