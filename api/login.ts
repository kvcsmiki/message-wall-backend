import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password } = req.body;
        const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user) return res.status(400).json({ error: 'User not found' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}