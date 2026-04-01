import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
const FRONTEND_URL = process.env.FRONTEND_URL!;


export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const id = req.query.id;
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ message: 'Deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}