import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://message-wall-frontend.vercel.app')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

    if (req.method === 'OPTIONS') return res.status(200).end()

    if (req.url === '/api/register' && req.method === 'POST') {
        const { email, password } = req.body

        const hashed = await bcrypt.hash(password, 10)

        const { error } = await supabase
            .from('users')
            .insert([{ email, password: hashed }])

        if (error) return res.status(400).json({ error: error.message })

        return res.json({ success: true })
    }

    if (req.url === '/api/login' && req.method === 'POST') {
        const { email, password } = req.body

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (!user) return res.status(400).json({ error: 'Invalid credentials' })

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' })

        const token = jwt.sign({ id: user.id }, JWT_SECRET)

        return res.json({ token })
    }

    if (req.url === '/api/messages' && req.method === 'GET') {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })

        return res.json(data)
    }

    if (req.url === '/api/messages' && req.method === 'POST') {
        const token = req.headers.authorization?.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)

        const { content } = req.body

        const { error } = await supabase
            .from('messages')
            .insert([{ content, user_id: decoded.id }])

        if (error) return res.status(400).json({ error: error.message })

        return res.json({ success: true })
    }

    if (req.url.startsWith('/api/messages/') && req.method === 'DELETE') {
        const id = req.url.split('/').pop()

        await supabase.from('messages').delete().eq('id', id)

        return res.json({ success: true })
    }

    res.status(404).end()
}