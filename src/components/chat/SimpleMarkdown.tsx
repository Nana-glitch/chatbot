import { Fragment, type ReactElement } from 'react'

function renderInline(text: string): (string | ReactElement)[] {
  const out: (string | ReactElement)[] = []
  let i = 0

  function pushString(s: string) {
    if (!s) return
    out.push(s)
  }

  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        const code = text.slice(i + 1, end)
        out.push(
          <code
            key={`c_${i}`}
            className="rounded-md bg-muted px-1 py-0.5 font-mono text-[0.85em]"
          >
            {code}
          </code>
        )
        i = end + 1
        continue
      }
    }

    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        const bold = text.slice(i + 2, end)
        out.push(
          <strong key={`b_${i}`} className="font-semibold">
            {bold}
          </strong>
        )
        i = end + 2
        continue
      }
    }

    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1) {
        const italic = text.slice(i + 1, end)
        if (italic.trim()) {
          out.push(
            <em key={`i_${i}`} className="italic">
              {italic}
            </em>
          )
          i = end + 1
          continue
        }
      }
    }

    const nextCandidates = [
      text.indexOf('`', i),
      text.indexOf('**', i),
      text.indexOf('*', i),
    ]
      .filter((n) => n !== -1)
      .sort((a, b) => a - b)
    const next = nextCandidates.length ? nextCandidates[0] : -1
    if (next === -1) {
      pushString(text.slice(i))
      break
    }
    pushString(text.slice(i, next))
    i = next
  }

  return out
}

export function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: JSX.Element[] = []

  let idx = 0
  while (idx < lines.length) {
    const line = lines[idx] ?? ''

    if (line.trim().startsWith('```')) {
      const start = idx
      idx += 1
      const codeLines: string[] = []
      while (idx < lines.length && !(lines[idx] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[idx] ?? '')
        idx += 1
      }
      if (idx < lines.length) idx += 1

      blocks.push(
        <pre
          key={`pre_${start}`}
          className="mt-2 overflow-x-auto rounded-xl border bg-muted px-3 py-2 text-xs leading-relaxed"
        >
          <code className="font-mono">{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = h[1]!.length
      const text = h[2]!.trim()
      const cls =
        level === 1
          ? 'text-base font-semibold mt-2'
          : level === 2
            ? 'text-sm font-semibold mt-2'
            : 'text-sm font-medium mt-2'
      blocks.push(
        <div key={`h_${idx}`} className={cls}>
          {renderInline(text).map((p, i) => (
            <Fragment key={i}>{p}</Fragment>
          ))}
        </div>
      )
      idx += 1
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const start = idx
      const items: string[] = []
      while (idx < lines.length && /^\s*[-*]\s+/.test(lines[idx] ?? '')) {
        items.push((lines[idx] ?? '').replace(/^\s*[-*]\s+/, '').trimEnd())
        idx += 1
      }
      blocks.push(
        <ul key={`ul_${start}`} className="mt-2 list-disc pl-5 space-y-1">
          {items.map((t, i) => (
            <li key={i}>
              {renderInline(t).map((p, j) => (
                <Fragment key={j}>{p}</Fragment>
              ))}
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const start = idx
      const items: string[] = []
      while (idx < lines.length && /^\s*\d+\.\s+/.test(lines[idx] ?? '')) {
        items.push((lines[idx] ?? '').replace(/^\s*\d+\.\s+/, '').trimEnd())
        idx += 1
      }
      blocks.push(
        <ol key={`ol_${start}`} className="mt-2 list-decimal pl-5 space-y-1">
          {items.map((t, i) => (
            <li key={i}>
              {renderInline(t).map((p, j) => (
                <Fragment key={j}>{p}</Fragment>
              ))}
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (!line.trim()) {
      blocks.push(<div key={`sp_${idx}`} className="h-2" />)
      idx += 1
      continue
    }

    const start = idx
    const para: string[] = [line]
    idx += 1
    while (idx < lines.length) {
      const l = lines[idx] ?? ''
      if (
        !l.trim() ||
        l.trim().startsWith('```') ||
        /^(#{1,3})\s+/.test(l) ||
        /^\s*[-*]\s+/.test(l) ||
        /^\s*\d+\.\s+/.test(l)
      ) {
        break
      }
      para.push(l)
      idx += 1
    }
    const text = para.join('\n')
    blocks.push(
      <p key={`p_${start}`} className="mt-2 whitespace-pre-wrap leading-relaxed">
        {renderInline(text).map((p, i) => (
          <Fragment key={i}>{p}</Fragment>
        ))}
      </p>
    )
  }

  return <div className="max-w-none">{blocks}</div>
}

