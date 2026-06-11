import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { preprocessWikiLinks } from '../../lib/notes'

export function Markdown({
  body,
  onWikiLink,
}: {
  body: string
  onWikiLink: (title: string) => void
}) {
  const processed = preprocessWikiLinks(body)
  return (
    <div className="prose-notes">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            if (href?.startsWith('wiki:')) {
              const title = decodeURIComponent(href.slice(5))
              return (
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    onWikiLink(title)
                  }}
                  className="rounded bg-[var(--color-accent-soft)] px-1 text-[var(--color-accent)] no-underline"
                >
                  {children}
                </a>
              )
            }
            return (
              <a href={href} target="_blank" rel="noreferrer" {...props}>
                {children}
              </a>
            )
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
