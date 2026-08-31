import { useState } from 'react'
import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import { newsItems, newsTags } from '../data/mockNews'
import NewsCard from '../components/NewsCard'

export default function News() {
  const [tagFilter, setTagFilter] = useState<string>('All')

  const filtered = newsItems.filter((item) => {
    if (tagFilter !== 'All' && item.tag !== tagFilter) return false
    return true
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">News & Advisories</h1>
        <p className="text-sm text-slate-400">
          External news coverage and official bulletins related to landslide activity in NER
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
          <Filter className="h-4 w-4" /> Filter by type
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...newsTags].map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                tagFilter === tag
                  ? 'bg-risk-low/20 text-risk-low border border-risk-low/40'
                  : 'border border-ridge-border text-slate-400 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-slate-500">No news items match the selected filter.</p>
        )}
      </div>
    </motion.div>
  )
}
