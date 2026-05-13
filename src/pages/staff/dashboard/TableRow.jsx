import React from 'react'

const avatarPalette = ['bg-violet-600', 'bg-emerald-600', 'bg-cyan-600', 'bg-orange-600', 'bg-blue-600']

const formatDisplayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB')
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const getValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') || '—'

const getProceedingLabel = (row) => getValue(
  row.proceeding_name,
  row.proceeding_title,
  row.notice_title,
  row.assignment_method,
  row.proceeding_type,
  row.notice_type
)

const getNoticeType = (row) => getValue(
  row.notice_type,
  row.type,
  row.assignment_type,
  row.notice_category
)

const getReferenceId = (row) => getValue(
  row.reference_id,
  row.notice_reference_id,
  row.proceeding_id,
  row.notice_id,
  row.id
)

const getIssuedOn = (row) => getValue(row.issued_on, row.created_at, row.assigned_at, row.updated_at)

const getDueTone = (row) => {
  const status = String(row.status || row.assignment_status || row.notice_status || '').toLowerCase()
  if (status.includes('complete') || status.includes('done') || status.includes('closed')) {
    return 'green'
  }

  const dueDateValue = row.due_date || row.due_at || row.deadline || row.target_date
  if (!dueDateValue) return 'green'

  const dueDate = new Date(dueDateValue)
  if (Number.isNaN(dueDate.getTime())) return 'green'

  const now = new Date()
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'red'
  if (diffDays <= 3) return 'orange'
  return 'green'
}

const dueToneClasses = {
  red: 'text-red-600',
  orange: 'text-amber-600',
  green: 'text-emerald-600',
}

const TableRow = ({ row, index, onViewNotice }) => {
  const userName = getValue(row.notice_assessee_name, row.assessee_name, row.user_name, row.client_name, row.name)
  const avatarClass = avatarPalette[index % avatarPalette.length]
  const dueTone = getDueTone(row)

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/90">
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarClass}`}>
            {getInitials(userName)}
          </div>
          <p className="text-sm font-semibold text-slate-900">{userName}</p>
        </div>
      </td>
      <td className="px-6 py-4 align-middle">
        <p className="text-sm font-semibold text-slate-900">{getProceedingLabel(row)}</p>
      </td>
      <td className="px-6 py-4 align-middle">
        <p className="text-sm text-slate-500">{getNoticeType(row)}</p>
      </td>
      <td className="px-6 py-4 align-middle">
        <p className="font-mono text-xs font-medium text-blue-600">{getReferenceId(row)}</p>
      </td>
      <td className="px-6 py-4 align-middle">
        <p className="text-sm text-slate-500">{formatDisplayDate(getIssuedOn(row))}</p>
      </td>
      <td className="px-6 py-4 align-middle">
        <p className={`text-sm font-medium ${dueToneClasses[dueTone]}`}>{formatDisplayDate(row.due_date || row.due_at || row.deadline || row.target_date)}</p>
      </td>
      <td className="px-6 py-4 align-middle text-right">
        <button
          type="button"
          onClick={() => onViewNotice?.(row)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
        >
          VIEW NOTICE
        </button>
      </td>
    </tr>
  )
}

export default TableRow
