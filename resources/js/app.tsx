import { createInertiaApp } from '@inertiajs/react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

import { initializeTheme } from '@/hooks/use-appearance'
import AppLayout from '@/layouts/app-layout'
import AuthLayout from '@/layouts/auth-layout'

declare global {
    interface Window {
        Echo: Echo<'reverb'>
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

createInertiaApp({
    title: title => title || appName,
    layout: name => name.startsWith('auth/') ? AuthLayout : AppLayout,
    strictMode: false,
    withApp: app => app,
    progress: {
        color: '#4B5563',
    },
})

// This will set light / dark mode on load...
initializeTheme()

if (typeof window !== 'undefined') {
    window.Pusher = Pusher

    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    })
}
