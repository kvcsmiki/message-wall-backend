import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
const FRONTEND_URL = process.env.FRONTEND_URL!;


export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const { content } = req.body;
            const { data, error } = await supabase.from('messages').insert([{ content }]);
            if (error) throw error;
            return res.status(200).json(data ? data[0] : null);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}