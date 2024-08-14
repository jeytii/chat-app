import { createInertiaApp } from '@inertiajs/react'
import { type PageProps } from '@inertiajs/core'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/ThemeProvider'

interface Props {
  user?: {
    first_name: string;
    last_name: string;
    name: string;
    username: string;
    dark_mode: boolean;
    profile_photo: string|null;
  };
}

createInertiaApp<PageProps & Props>({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })

    return pages[`./Pages/${name}.tsx`]
  },
  setup({ el, App, props }) {
    const { user } = props.initialPage.props

    createRoot(el).render(
      <ThemeProvider
        defaultTheme={user?.dark_mode ? 'dark' : 'light'}
        storageKey='vite-ui-theme'
      >
        <App {...props} />
      </ThemeProvider>
    )
  },
})