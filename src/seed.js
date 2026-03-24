const TITLES = [
  'Scope API contracts',
  'Draft rollout plan',
  'Fix pagination edge case',
  'Audit accessibility',
  'Optimize bundle size',
  'Design review follow-ups',
  'Sync with stakeholders',
  'Write integration tests',
  'Refactor auth flow',
  'Migrate legacy table',
  'Document error codes',
  'Triage production alerts',
]

const STATUSES = ['todo', 'in_progress', 'in_review', 'done']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

function rng(seed) {
  let s = seed >>> 0
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function toIsoDate(d) {
  return d.toISOString().slice(0, 10)
}

export const USERS = [
  { id: 'u1', name: 'Alex Rivera', initials: 'AR' },
  { id: 'u2', name: 'Jordan Lee', initials: 'JL' },
  { id: 'u3', name: 'Sam Patel', initials: 'SP' },
  { id: 'u4', name: 'Taylor Kim', initials: 'TK' },
  { id: 'u5', name: 'Morgan Chen', initials: 'MC' },
  { id: 'u6', name: 'Riley Brooks', initials: 'RB' },
]

export function generateTasks(count, seed = 42) {
  const random = rng(seed)
  const now = new Date()
  const result = []

  for (let i = 0; i < count; i++) {
    const dueOffset = Math.floor(random() * 80) - 25
    const due = new Date(now)
    due.setDate(now.getDate() + dueOffset)

    const span = 1 + Math.floor(random() * 16)
    const start = new Date(due)
    start.setDate(due.getDate() - span)

    result.push({
      id: `task-${i}`,
      title: `${TITLES[i % TITLES.length]} #${i}`,
      assigneeId: USERS[Math.floor(random() * USERS.length)].id,
      priority: PRIORITIES[Math.floor(random() * PRIORITIES.length)],
      status: STATUSES[Math.floor(random() * STATUSES.length)],
      startDate: i % 9 === 0 ? null : toIsoDate(start),
      dueDate: toIsoDate(due),
    })
  }

  return result
}

export const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' },
]

export const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low']
