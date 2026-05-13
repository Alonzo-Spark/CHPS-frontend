import React from 'react'

const StatCard = ({ title, value, subtitle, color = 'blue', trend }) => {
  const barColor = {
    blue: 'bg-blue-600',
    red: 'bg-rose-500',
    gray: 'bg-slate-400',
    green: 'bg-emerald-500',
  }[color] || 'bg-blue-600'

  const trendClassName = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-rose-50 text-rose-700',
    gray: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
  }[color] || 'bg-blue-50 text-blue-700'

  return (
    <article className="rounded-[12px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-[32px] font-semibold leading-none text-slate-900">{value ?? '—'}</span>
        {trend ? <span className={`rounded-full px-2 py-1 text-xs font-semibold ${trendClassName}`}>{trend}</span> : null}
      </div>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      <div className={`mt-4 h-1.5 w-12 rounded-full ${barColor}`} />
    </article>
  )
}

export default StatCard
