import { parseMarkdown, type BlockNode, type InlineNode } from '@/lib/markdown/parse'

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return nodes.map((node, index) => {
    if (node.type === 'text') return node.text
    if (node.type === 'code') {
      return (
        <code key={index} className="rounded bg-line px-1 text-sm">
          {node.text}
        </code>
      )
    }
    if (node.type === 'link') {
      return (
        <a
          key={index}
          href={node.href}
          {...(node.href.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className="font-bold text-brand-dark underline"
        >
          <Inline nodes={node.children} />
        </a>
      )
    }
    const Tag = node.type === 'bold' ? 'strong' : 'em'
    return (
      <Tag key={index}>
        <Inline nodes={node.children} />
      </Tag>
    )
  })
}

const HEADING_CLASS = { 1: 'text-xl font-black', 2: 'text-lg font-black', 3: 'font-black' } as const

function Block({ block }: { block: BlockNode }) {
  if (block.type === 'heading') {
    return (
      <p role="heading" aria-level={block.level + 1} className={`mt-4 ${HEADING_CLASS[block.level]}`}>
        <Inline nodes={block.children} />
      </p>
    )
  }
  if (block.type === 'list') {
    const List = block.ordered ? 'ol' : 'ul'
    return (
      <List className={`mt-2 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
        {block.items.map((item, index) => (
          <li key={index}>
            <Inline nodes={item} />
          </li>
        ))}
      </List>
    )
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="mt-2 border-l-4 border-line pl-3 text-muted">
        <Inline nodes={block.children} />
      </blockquote>
    )
  }
  return (
    <p className="mt-2">
      <Inline nodes={block.children} />
    </p>
  )
}

export default function Markdown({ source }: { source: string }) {
  return (
    <div className="break-words">
      {parseMarkdown(source).map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
