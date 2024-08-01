import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Index() {
  const [loading, setLoading] = useState<boolean>(false)

  function logout() {
    router.post('/logout', {}, {
      onBefore() {
        setLoading(true)
      }
    })
  }

  return (
    <div>
      <h1>Index page</h1>
      {loading ? (
        <Button
          className='text-base'
          disabled
        >
          <Loader2 className='animate-spin' />
          <span className='ml-2'>Logging out</span>
        </Button>
      ) : (
        <Button
          className='text-base'
          onClick={logout}
        >
          Logout
        </Button>
      )}
    </div>
  )
}