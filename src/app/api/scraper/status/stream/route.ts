import { NextRequest } from 'next/server'
import { scrapingState } from '../../state'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false
      
      const send = () => {
        if (isClosed) return
        try {
          const payload = JSON.stringify({ success: true, status: scrapingState })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        } catch (error) {
          // Controller might be closed, stop trying to send
          isClosed = true
          clearInterval(interval)
          clearInterval(stopCheck)
        }
      }

      // send immediately
      send()

      // push updates periodically
      const interval = setInterval(send, 1000)

      // stop when not running for a while
      const stopCheck = setInterval(() => {
        if (!scrapingState.isRunning && !isClosed) {
          // send one final payload and close
          send()
          isClosed = true
          clearInterval(interval)
          clearInterval(stopCheck)
          try {
            controller.close()
          } catch (error) {
            // Controller might already be closed
          }
        }
      }, 1500)

      // on cancel, cleanup
      ;(controller as any).onCancel = () => {
        isClosed = true
        clearInterval(interval)
        clearInterval(stopCheck)
      }
    },
    cancel() {
      // Cleanup on cancel
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  })
}


