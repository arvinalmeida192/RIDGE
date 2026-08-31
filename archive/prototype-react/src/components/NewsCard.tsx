import { Newspaper, CloudRain, Building2 } from 'lucide-react'
import type { NewsItem } from '../data/mockNews'
import { tagStyles } from '../data/mockNews'

interface NewsCardProps {
  item: NewsItem
  compact?: boolean
}

const tagIcons = {
  News: Newspaper,
  'Government Advisory': Building2,
  'Weather Bulletin': CloudRain,
}

export default function NewsCard({ item, compact = false }: NewsCardProps) {
  const styles = tagStyles[item.tag]
  const Icon = tagIcons[item.tag]
  const time = new Date(item.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article
      className={`rounded-xl border border-ridge-border bg-slate-900/40 border-l-4 ${styles.border} ${
        compact ? 'p-3' : 'p-5'
      }`}
    >
      <div className="flex gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 ${compact ? 'h-8 w-8' : ''}`}>
          <Icon className={`text-slate-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles.badge}`}>
              {item.tag}
            </span>
            {item.state && (
              <span className="text-[10px] text-slate-500">{item.state}{item.zone ? ` · ${item.zone}` : ''}</span>
            )}
          </div>
          <h3 className={`font-semibold text-white ${compact ? 'text-sm leading-snug' : 'text-base'}`}>
            {item.headline}
          </h3>
          <p className={`mt-1 text-slate-400 ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}>
            {item.summary}
          </p>
          <div className={`mt-2 flex items-center gap-2 text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span className="font-medium text-slate-400">{item.source}</span>
            <span>·</span>
            <time>{time}</time>
          </div>
        </div>
      </div>
    </article>
  )
}
