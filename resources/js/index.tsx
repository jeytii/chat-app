import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type PageProps } from '@inertiajs/core'
import { createInertiaApp } from '@inertiajs/react'
import Pusher from 'pusher-js'
import Echo from 'laravel-echo'
import { ThemeProvider } from './components/ThemeProvider'
import { type User } from '@/types'

declare global {
  interface Window {
      Pusher: typeof Pusher;
      Echo: Echo; 
  }
}

interface Props extends PageProps {
  user?: User;
}

createInertiaApp<Props>({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })

    return pages[`./Pages/${name}.tsx`]
  },
  setup({ el, App, props }) {
    const { user } = props.initialPage.props
    const root = (
      <ThemeProvider
        defaultTheme={user?.dark_mode ? 'dark' : 'light'}
        storageKey='vite-ui-theme'
      >
        <App {...props} />
      </ThemeProvider>
    )

    if (user) {
      const queryClient = new QueryClient()

      window.Pusher = Pusher
 
      window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT,
        wssPort: import.meta.env.VITE_REVERB_PORT,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
      })

      createRoot(el).render(
        <QueryClientProvider client={queryClient}>
          {root}

          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition='bottom-left'
          />
        </QueryClientProvider>
      )
    } else {
      createRoot(el).render(root)
    }
  },
})