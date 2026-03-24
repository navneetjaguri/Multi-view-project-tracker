import { useEffect, useMemo, useRef, useState } from 'react'
import { generateTasks, PRIORITY_ORDER, STATUS_COLUMNS, USERS } from './seed'

const STATUS_LABEL_MAP = Object.fromEntries(STATUS_COLUMNS.map((c) => [c.key, c.label]))

function parseParams() {
  const sp = new URLSearchParams(window.location.search)
  const arr = (k) => (sp.get(k) ? sp.get(k).split(',').filter(Boolean) : [])
  return {
    view: ['kanban', 'list', 'timeline'].includes(sp.get('view')) ? sp.get('view') : 'kanban',
    status: arr('status'),
    priority: arr('priority'),
    assignee: arr('assignee'),
    dueFrom: sp.get('dueFrom') || '',
    dueTo: sp.get('dueTo') || '',
    sortBy: ['title', 'priority', 'dueDate'].includes(sp.get('sortBy')) ? sp.get('sortBy') : 'dueDate',
    sortDir: sp.get('sortDir') === 'desc' ? 'desc' : 'asc',
  }
}

function setParams(state) {
  const sp = new URLSearchParams()
  if (state.view !== 'kanban') sp.set('view', state.view)
  if (state.status.length) sp.set('status', state.status.join(','))
  if (state.priority.length) sp.set('priority', state.priority.join(','))
  if (state.assignee.length) sp.set('assignee', state.assignee.join(','))
  if (state.dueFrom) sp.set('dueFrom', state.dueFrom)
  if (state.dueTo) sp.set('dueTo', state.dueTo)
  if (state.sortBy !== 'dueDate') sp.set('sortBy', state.sortBy)
  if (state.sortDir !== 'asc') sp.set('sortDir', state.sortDir)
  const next = `${window.location.pathname}${sp.toString() ? `?${sp}` : ''}`
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.pushState(null, '', next)
  }
}

function dueLabel(dueDate) {
  const d = new Date(`${dueDate}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (d.getTime() === today.getTime()) return 'Due Today'
  if (d < today) {
    const days = Math.floor((today - d) / 86400000)
    if (days > 7) return `${days} days overdue`
  }
  return d.toLocaleDateString()
}

function sortArrow(ui, key) {
  if (ui.sortBy !== key) return ''
  return ui.sortDir === 'asc' ? ' ↑' : ' ↓'
}

export default function App() {
  const [tasks, setTasks] = useState(() => generateTasks(520))
  const [ui, setUi] = useState(() => parseParams())
  const [collab, setCollab] = useState([
    { id: 'c1', name: 'Avery', color: '#38bdf8', taskId: null },
    { id: 'c2', name: 'Blair', color: '#a78bfa', taskId: null },
    { id: 'c3', name: 'Casey', color: '#f472b6', taskId: null },
    { id: 'c4', name: 'Drew', color: '#fbbf24', taskId: null },
  ])
  const [drag, setDrag] = useState(null)
  const listScrollRef = useRef(null)
  const cardRefs = useRef({})
  const [scrollTop, setScrollTop] = useState(0)
  const [listViewportH, setListViewportH] = useState(420)

  useEffect(() => {
    const onPop = () => setUi(parseParams())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    setParams(ui)
  }, [ui])

  useEffect(() => {
    const id = setInterval(() => {
      setCollab((prev) =>
        prev.map((c) => ({
          ...c,
          taskId: tasks[Math.floor(Math.random() * tasks.length)]?.id ?? null,
        })),
      )
    }, 2300)
    return () => clearInterval(id)
  }, [tasks])

  useEffect(() => {
    if (ui.view !== 'list') return
    const el = listScrollRef.current
    if (!el) return
    const update = () => setListViewportH(el.clientHeight || 420)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const id = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
    }
  }, [ui.view])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (ui.status.length && !ui.status.includes(t.status)) return false
      if (ui.priority.length && !ui.priority.includes(t.priority)) return false
      if (ui.assignee.length && !ui.assignee.includes(t.assigneeId)) return false
      if (ui.dueFrom && t.dueDate < ui.dueFrom) return false
      if (ui.dueTo && t.dueDate > ui.dueTo) return false
      return true
    })
  }, [tasks, ui])

  const sorted = useMemo(() => {
    const m = ui.sortDir === 'asc' ? 1 : -1
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (ui.sortBy === 'title') return a.title.localeCompare(b.title) * m
      if (ui.sortBy === 'priority') {
        return (PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)) * m
      }
      return (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0) * m
    })
    return arr
  }, [filtered, ui.sortBy, ui.sortDir])

  function updateTaskStatus(taskId, status) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  function startPointerDrag(e, task, status) {
    const rect = cardRefs.current[task.id]?.getBoundingClientRect()
    if (!rect) return
    setDrag({
      taskId: task.id,
      from: status,
      over: status,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      snapBack: false,
    })
  }

  useEffect(() => {
    if (!drag) return
    function onMove(e) {
      const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-drop-status]')
      setDrag((prev) =>
        prev
          ? { ...prev, x: e.clientX, y: e.clientY, over: zone ? zone.getAttribute('data-drop-status') : null }
          : prev,
      )
    }
    function onUp() {
      setDrag((prev) => {
        if (!prev) return prev
        if (prev.over) {
          updateTaskStatus(prev.taskId, prev.over)
          return null
        }
        return { ...prev, snapBack: true, over: null }
      })
      window.setTimeout(() => setDrag(null), 220)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag])

  const activeFilters = ui.status.length || ui.priority.length || ui.assignee.length || ui.dueFrom || ui.dueTo
  const visibleCount = collab.filter((c) => c.taskId).length

  const rowHeight = 52
  const viewportHeight = Math.max(120, listViewportH)
  const overscan = 5
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(sorted.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan)
  const virtualRows = sorted.slice(startIndex, endIndex)
  const topPad = startIndex * rowHeight
  const bottomPad = Math.max(0, (sorted.length - endIndex) * rowHeight)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const totalDays = Math.round((monthEnd - monthStart) / 86400000) + 1
  const pxPerDay = 24
  const timelineWidth = totalDays * pxPerDay
  const todayPos = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - monthStart) / 86400000) * pxPerDay
  const monthTitle = now.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="app">
      <header className="topbar">
        <div className="title-wrap">
          <h1>Multi-View Project Tracker</h1>
          <p>Shared task data across Kanban, List, and Timeline</p>
        </div>
        <div className="presence-wrap">
          <div className="presence-avatars" aria-hidden>
            {collab.map((c) => (
              <span key={c.id} className="presence-dot" style={{ background: c.color }} title={c.name} />
            ))}
          </div>
          <div className="presence">
            <strong>{visibleCount}</strong> people viewing · Board updates as you filter
          </div>
        </div>
      </header>

      <section className="filters">
        <div className="filters-head">
          <span className="filters-label">Workspace</span>
          <div className="row view-switch" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={ui.view === 'kanban'}
              id="tab-kanban"
              className={ui.view === 'kanban' ? 'active' : ''}
              onClick={() => setUi((s) => ({ ...s, view: 'kanban' }))}
            >
              Kanban
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ui.view === 'list'}
              id="tab-list"
              className={ui.view === 'list' ? 'active' : ''}
              onClick={() => setUi((s) => ({ ...s, view: 'list' }))}
            >
              List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ui.view === 'timeline'}
              id="tab-timeline"
              className={ui.view === 'timeline' ? 'active' : ''}
              onClick={() => setUi((s) => ({ ...s, view: 'timeline' }))}
            >
              Timeline
            </button>
          </div>
        </div>
        <div className="filter-rows">
          <div className="filter-cluster">
            <span className="cluster-title">Dimensions</span>
            <div className="row wrap cluster-body">
              <Multi label="Status" options={STATUS_COLUMNS.map((s) => ({ value: s.key, label: s.label }))} value={ui.status} onChange={(v) => setUi((s) => ({ ...s, status: v }))} />
              <Multi label="Priority" options={PRIORITY_ORDER.map((x) => ({ value: x, label: x }))} value={ui.priority} onChange={(v) => setUi((s) => ({ ...s, priority: v }))} />
              <Multi label="Assignee" options={USERS.map((u) => ({ value: u.id, label: u.name }))} value={ui.assignee} onChange={(v) => setUi((s) => ({ ...s, assignee: v }))} />
            </div>
          </div>
          <div className="filter-cluster date-cluster">
            <span className="cluster-title">Due date range</span>
            <div className="row wrap cluster-body">
              <label className="field">
                <span>From</span>
                <input type="date" value={ui.dueFrom} onChange={(e) => setUi((s) => ({ ...s, dueFrom: e.target.value }))} />
              </label>
              <label className="field">
                <span>To</span>
                <input type="date" value={ui.dueTo} onChange={(e) => setUi((s) => ({ ...s, dueTo: e.target.value }))} />
              </label>
              {activeFilters ? (
                <button type="button" className="btn-ghost" onClick={() => setUi((s) => ({ ...s, status: [], priority: [], assignee: [], dueFrom: '', dueTo: '' }))}>
                  Clear all filters
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="meta-bar">
        <span>
          <strong>{filtered.length}</strong> of {tasks.length} tasks match
          {activeFilters ? <span className="meta-hint">Filters sync to the URL — share this page to collaborate.</span> : null}
        </span>
        <span className="meta-view">{ui.view === 'kanban' ? 'Board' : ui.view === 'list' ? 'Table' : 'Timeline'} view</span>
      </div>

      {ui.view === 'kanban' && (
        <section className="kanban main-fill">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key)
            return (
              <div
                key={col.key}
                className={`column ${drag?.over === col.key ? 'drop-over' : ''}`}
                data-drop-status={col.key}
              >
                <h3>{col.label} <span className="count-pill">{colTasks.length}</span></h3>
                <div className="cards">
                  {colTasks.length === 0 ? (
                    <div className="empty">
                      <span className="empty-title">Nothing here</span>
                      <span className="empty-sub">Try another column or loosen filters — or drag a card here.</span>
                    </div>
                  ) : null}
                  {colTasks.map((task) => {
                    const user = USERS.find((u) => u.id === task.assigneeId)
                    const here = collab.filter((c) => c.taskId === task.id)
                    return (
                      <article
                        key={task.id}
                        ref={(el) => {
                          cardRefs.current[task.id] = el
                        }}
                        className={`card ${drag?.taskId === task.id ? 'dragging' : ''}`}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return
                          startPointerDrag(e, task, col.key)
                        }}
                      >
                        <div className="avatars">
                          {here.slice(0, 3).map((c) => <span key={c.id} style={{ background: c.color }}>{c.name[0]}</span>)}
                          {here.length > 3 ? <span className="more">+{here.length - 3}</span> : null}
                        </div>
                        <h4 className="card-title" title={task.title}>{task.title}</h4>
                        <div className="meta">
                          <span className={`badge ${task.priority}`}>{task.priority}</span>
                          <span className="assignee-chip">{user?.initials}</span>
                          <span className={new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toDateString()) ? 'overdue' : ''}>{dueLabel(task.dueDate)}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {ui.view === 'list' && (
        <section className="list main-fill">
          <div className="list-shell">
            <div className="thead">
              <button type="button" className={ui.sortBy === 'title' ? 'sort-active' : ''} onClick={() => setUi((s) => ({ ...s, sortBy: 'title', sortDir: s.sortBy === 'title' && s.sortDir === 'asc' ? 'desc' : 'asc' }))}>Title{sortArrow(ui, 'title')}</button>
              <button type="button" className={ui.sortBy === 'priority' ? 'sort-active' : ''} onClick={() => setUi((s) => ({ ...s, sortBy: 'priority', sortDir: s.sortBy === 'priority' && s.sortDir === 'asc' ? 'desc' : 'asc' }))}>Priority{sortArrow(ui, 'priority')}</button>
              <button type="button" className={ui.sortBy === 'dueDate' ? 'sort-active' : ''} onClick={() => setUi((s) => ({ ...s, sortBy: 'dueDate', sortDir: s.sortBy === 'dueDate' && s.sortDir === 'asc' ? 'desc' : 'asc' }))}>Due Date{sortArrow(ui, 'dueDate')}</button>
              <span className="th-status">Status</span>
            </div>
            {sorted.length === 0 ? (
              <div className="empty large">
                <span className="empty-title">No rows match</span>
                <span className="empty-sub">Adjust filters or clear them to see tasks again.</span>
                <button type="button" onClick={() => setUi((s) => ({ ...s, status: [], priority: [], assignee: [], dueFrom: '', dueTo: '' }))}>Clear filters</button>
              </div>
            ) : (
              <div className="vlist-scroll" ref={listScrollRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
                <div style={{ height: topPad }} />
                {virtualRows.map((task, i) => (
                  <div className={`row-item ${(startIndex + i) % 2 ? 'alt' : ''}`} key={task.id}>
                    <span className="row-title" title={task.title}>{task.title}</span>
                    <span className={`badge ${task.priority}`}>{task.priority}</span>
                    <span className="row-due">{dueLabel(task.dueDate)}</span>
                    <select className="row-status" value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} aria-label={`Status for ${task.title}`}>
                      {STATUS_COLUMNS.map((x) => (
                        <option key={x.key} value={x.key}>{x.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div style={{ height: bottomPad }} />
              </div>
            )}
          </div>
        </section>
      )}

      {ui.view === 'timeline' && (
        <section className="timeline-wrap main-fill">
          <div className="timeline-head">
            <span className="timeline-title">{monthTitle}</span>
            <span className="timeline-hint">Scroll horizontally · Orange line is today</span>
          </div>
          <div
            className="timeline"
            style={{ width: timelineWidth + 120, ['--day']: `${pxPerDay}px` }}
          >
            <div className="timeline-grid-bg" aria-hidden />
            <div className="today-line" style={{ left: 120 + todayPos }} title="Today" />
            {filtered.map((task) => {
              const s = task.startDate ? new Date(`${task.startDate}T00:00:00`) : new Date(`${task.dueDate}T00:00:00`)
              const e = new Date(`${task.dueDate}T00:00:00`)
              const left = 120 + Math.max(0, Math.floor((s - monthStart) / 86400000)) * pxPerDay
              const width = Math.max(6, (Math.max(1, Math.floor((e - s) / 86400000) + 1)) * pxPerDay)
              return (
                <div className="tl-row" key={task.id}>
                  <span title={task.title}>{task.title}</span>
                  <div className={`bar ${task.priority}`} style={{ left, width }} />
                </div>
              )
            })}
          </div>
        </section>
      )}
      {drag ? (
        <div
          className={`drag-ghost ${drag.snapBack ? 'snap-back' : ''}`}
          style={{
            width: drag.width,
            height: drag.height,
            transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px)`,
          }}
        >
          <span className="ghost-label">{tasks.find((t) => t.id === drag.taskId)?.title}</span>
          <span className="ghost-meta">
            {STATUS_LABEL_MAP[tasks.find((t) => t.id === drag.taskId)?.status] ?? ''}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function Multi({ label, options, value, onChange }) {
  return (
    <label className="multi">
      <span>{label}</span>
      <span className="multi-hint">Ctrl/Cmd-click for multiple</span>
      <select
        multiple
        value={value}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((x) => x.value))}
        aria-label={`${label} filter`}
      >
        {options.map((o) => <option value={o.value} key={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
