import { createInertiaApp } from '@inertiajs/react'
import { type PageProps } from '@inertiajs/core'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/ThemeProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface Props {
  user?: {
    first_name: string;
    last_name: string;
    name: string;
    username: string;
    dark_mode: boolean;
    profile_photo_url?: string;
  };
}

createInertiaApp<PageProps & Props>({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })

    return pages[`./Pages/${name}.tsx`]
  },
  setup({ el, App, props }) {
    const queryClient = new QueryClient()
    const { user } = props.initialPage.props
    const root = (
      <ThemeProvider
        defaultTheme={user?.dark_mode ? 'dark' : 'light'}
        storageKey='vite-ui-theme'
      >
        <App {...props} />
      </ThemeProvider>
    )

    createRoot(el).render(
      user ? (
        <QueryClientProvider client={queryClient}>
          {root}
        </QueryClientProvider>
      ) : (
        root
      )
    )
  },
})