// Strip any surrounding quotes that may appear if VITE_API_URL is set as `""` in the host env
const raw = (import.meta.env.VITE_API_URL ?? '').replace(/^["']+|["']+$/g, '').trim()
export const BACKEND = raw || 'https://webshield-backend-api.onrender.com'
