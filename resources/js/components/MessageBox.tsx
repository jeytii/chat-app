import { type ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export default function MessageBox() {
  function watchHeight(event: ChangeEvent<HTMLTextAreaElement>) {
    const { target } = event

    if (target.value) {
      target.style.height = 'auto'
      target.style.height = `${target.scrollHeight}px`
    } else {
      target.removeAttribute('style')
    }
  }

  return (
    <div>
      <Textarea
        className='min-h-0 bg-secondary resize-none border-border overflow-hidden'
        placeholder='Write a message'
        rows={1}
        onInput={watchHeight}
      />
      <div className='flex gap-2 mt-2'>
        <Button
          className='bg-secondary border border-border'
          variant='ghost'
          size='sm'
        >
          <Camera size='20' />
        </Button>
        <Button
          className='bg-secondary border border-border'
          variant='ghost'
          size='sm'
        >
          GIF
        </Button>
        <Button
          className='bg-secondary border border-border ml-auto'
          variant='ghost'
          size='sm'
        >
          Send
        </Button>
      </div>
    </div>
  )
}