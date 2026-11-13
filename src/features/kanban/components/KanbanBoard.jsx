import React, { useState } from 'react'
import { Link2, LoaderCircle, UserRound } from 'lucide-react'
import { TASK_COLUMNS } from '../kanban.constants'
import { useMeta } from '../../../hooks/useMeta'
import { Badge } from '../../../components/ui/Badge'
import '../kanban.scss'

const TaskCard = ({ task, index, status, readOnly, busy, onOpen, onMove, onDragStart, onDropAt, statusOptions }) => (
  <article
    className={`task-card ${task.hasLateSubmission ? 'task-card--overdue' : ''} ${busy ? 'is-busy' : ''}`}
    draggable={!readOnly && !busy}
    onDragStart={(event) => onDragStart(event, task)}
    onDragOver={readOnly ? undefined : (event) => event.preventDefault()}
    onDrop={readOnly ? undefined : (event) => onDropAt(event, status, index)}
  >
    <button type="button" className="task-card__open" onClick={() => onOpen(task)}>
      <span className="task-card__title">{task.title}</span>
    </button>
    <div className="task-card__meta">
      {task.assignee && (
        <span title="Người thực hiện">
          <UserRound aria-hidden="true" /> {task.assignee.fullName}
        </span>
      )}
      {task.submissionCount > 0 && (
        <span title="Số lần nộp bài">
          <Link2 aria-hidden="true" /> {task.submissionCount}
        </span>
      )}
    </div>
    {task.hasLateSubmission && <Badge tone="danger">Nộp trễ</Badge>}
    {!readOnly && (
      <div className="task-card__status">
        <label className="sr-only" htmlFor={`status-${task.id}`}>
          Chuyển cột cho {task.title}
        </label>
        <select id={`status-${task.id}`} className="select select--sm" value={task.status} disabled={busy} onChange={(e) => onMove(task, e.target.value)}>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {busy && <LoaderCircle className="spin" aria-label="Đang lưu" />}
      </div>
    )}
  </article>
)

// Columns TODO / IN_PROGRESS / REVIEW / DONE. Drag a card onto another card to insert before it
// (→ `position`), or onto the column to append. The per-card select works for keyboard / touch.
const KanbanBoard = ({ tasks, readOnly = false, busyIds = new Set(), onOpen, onMove }) => {
  const { label } = useMeta()
  const [dragOver, setDragOver] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const statusOptions = TASK_COLUMNS.map((value) => ({ value, label: label('taskStatus', value) }))

  const handleDragStart = (event, task) => {
    event.dataTransfer.setData('text/plain', task.id)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(task.id)
  }

  // index = position among the target column's cards, excluding the dragged card.
  const handleDrop = (event, status, index) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(null)
    setDraggingId(null)
    const task = tasks.find((t) => t.id === event.dataTransfer.getData('text/plain'))
    if (!task) return
    const column = tasks.filter((t) => t.status === status && t.id !== task.id)
    const position = index === undefined ? column.length : index
    const currentIndex = tasks.filter((t) => t.status === status).findIndex((t) => t.id === task.id)
    if (task.status === status && currentIndex === position) return
    onMove(task, status, position)
  }

  return (
    <div className="kanban" role="list" aria-label="Bảng Kanban">
      {TASK_COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        let visibleIndex = 0
        return (
          <section
            key={status}
            role="listitem"
            aria-label={`${label('taskStatus', status)}: ${columnTasks.length} task`}
            className={`kanban__column kanban__column--${status.toLowerCase()} ${dragOver === status ? 'is-drag-over' : ''}`}
            onDragOver={
              readOnly
                ? undefined
                : (event) => {
                    event.preventDefault()
                    setDragOver(status)
                  }
            }
            onDragLeave={readOnly ? undefined : () => setDragOver((current) => (current === status ? null : current))}
            onDrop={readOnly ? undefined : (event) => handleDrop(event, status)}
          >
            <header className="kanban__header">
              <span className="kanban__dot" aria-hidden="true" />
              <h3>{label('taskStatus', status)}</h3>
              <span className="kanban__code">{status}</span>
              <span className="kanban__count">{columnTasks.length}</span>
            </header>
            <div className="kanban__cards">
              {columnTasks.length === 0 && <div className="kanban__empty">Không có task</div>}
              {columnTasks.map((task) => {
                const index = task.id === draggingId ? undefined : visibleIndex++
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    status={status}
                    readOnly={readOnly}
                    busy={busyIds.has(task.id)}
                    onOpen={onOpen}
                    onMove={(t, s) => onMove(t, s)}
                    onDragStart={handleDragStart}
                    onDropAt={handleDrop}
                    statusOptions={statusOptions}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default KanbanBoard
