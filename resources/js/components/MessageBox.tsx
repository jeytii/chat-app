import { type ChangeEvent } from 'react'
import { Image, ImagePlay, SendHorizonal } from 'lucide-react'
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
    <section className='border-t border-border bg-secondary dark:bg-gray-950'>
      <Textarea
        className='min-h-0 resize-none overflow-hidden rounded-none border-0 bg-transparent p-4'
        placeholder='Write a message'
        rows={1}
        onInput={watchHeight}
      />
      <div className='flex'>
        <Button
          className='h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
          variant='ghost'
          size='sm'
        >
          <Image size='20' />
        </Button>
        <Button
          className='h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
          variant='ghost'
          size='sm'
        >
          <ImagePlay size='20' />
        </Button>
        <Button
          className='ml-auto h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
          variant='ghost'
          size='sm'
        >
          <SendHorizonal size='20' />
        </Button>
      </div>
    </section>
  )
}