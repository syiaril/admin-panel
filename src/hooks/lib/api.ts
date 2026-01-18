// src/lib/api.ts
import { createBrowserClient } from '@supabase/ssr';

// Helper to get the API URL
export const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (process.env.NODE_ENV === 'production') {
        return 'https://express-supabase-api-six.vercel.app/api';
    }

    return 'http://localhost:4000/api';
};

// Helper to fetch from API with Supabase Auth
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Not authenticated');
    }

    const token = session.access_token;
    const url = `${getApiUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorBody;
        try {
            errorBody = await response.json();
            console.error('API Error JSON:', { url, status: response.status, body: errorBody });
        } catch (e) {
            const textHTML = await response.text();
            console.error('API Error Text:', { url, status: response.status, body: textHTML });
            throw new Error(`Request failed with status ${response.status}: ${textHTML.substring(0, 100)}`);
        }
        throw new Error(errorBody.error || `Request failed with status ${response.status}`);
    }

    return response.json();
};
