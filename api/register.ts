import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password } = req.body;
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const { data, error } = await supabase.from('users').insert([{ email, password: hashed }]);
        if (error) throw error;

        res.status(200).json({ message: 'User created' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}