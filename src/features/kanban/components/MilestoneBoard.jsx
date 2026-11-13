import React, { useMemo, useState } from 'react'
import { CalendarPlus, ListPlus, Pencil, Plus, RefreshCw, Trash2, Wand2 } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { PERMISSIONS as P } from '../../../constants/enums'
import { Card, CardBody } from '../../../components/ui/Card'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { formatDate, formatDateTime } from '../../../utils/format'
import { deleteMilestone, getMilestones, getTasks, moveTask } from '../kanban.service'
import KanbanBoard from './KanbanBoard'
import TaskModal from './TaskModal'
import CreateTaskModal from './CreateTaskModal'
import MilestoneFormModal from './MilestoneFormModal'
import '../kanban.scss'

// Default milestone: the one running today, else the latest past one, else the first.
function pickDefault(milestones) {
  const now = Date.now()
  const current = milestones.find((m) => new Date(`${m.startDate}T00:00:00+07:00`).getTime() <= now && new Date(m.dueAt).getTime() >= now)
  if (current) return current.id
  const past = milestones.filter((m) => new Date(m.dueAt).getTime() < now)
  return (past[past.length - 1] || milestones[0])?.id
}

const MilestoneBoard = ({ project, readOnly, renderTaskSubmissions }) => {
  const { can } = useAuth()
  const toast = useToast()
  const milestones = useAsync(() => getMilestones(project.id), [project.id])
  const [pickedId, setPickedId] = useState(null)
  const sorted = useMemo(() => [...(milestones.data || [])].sort((a, b) => a.weekNumber - b.weekNumber), [milestones.data])
  const selectedId = sorted.some((m) => m.id === pickedId) ? pickedId : pickDefault(sorted)
  const selected = sorted.find((m) => m.id === selectedId)
  const tasks = useAsync(() => (selectedId ? getTasks(selectedId) : Promise.resolve([])), [selectedId])
  const [busyIds, setBusyIds] = useState(() => new Set())
  const [openTaskId, setOpenTaskId] = useState(null)
  const [modal, setModal] = useState(null) // 'createTask' | 'createMilestone' | 'editMilestone' | 'generate' | 'deleteMilestone'
  const [deleting, setDeleting] = useState(false)

  const canEditTasks = can(P.TASK_EDIT) && !readOnly
  const canManageMilestones = can(P.MILESTONE_MANAGE) && !readOnly
  const members = project.members || []
  const openTask = tasks.data?.find((t) => t.id === openTaskId)

  const refreshAll = () => {
    tasks.reload()
    milestones.reload() // taskCounts / overdue
  }

  const handleMove = async (task, status, position) => {
    setBusyIds((s) => new Set(s).add(task.id))
    // Optimistic column change; the Backend re-orders the target column, so reload afterwards.
    tasks.setData((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await moveTask(task.id, status, position)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyIds((s) => {
        const next = new Set(s)
        next.delete(task.id)
        return next
      })
      refreshAll()
    }
  }

  const removeMilestone = async () => {
    setDeleting(true)
    try {
      await deleteMilestone(selected.id)
      toast.success('Đã xoá milestone.')
      setModal(null)
      setPickedId(null)
      milestones.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <AsyncContent
        {...milestones}
        onRetry={milestones.reload}
        empty={
          <Card>
            <EmptyState
              icon={CalendarPlus}
              title="Chưa có milestone"
              text={canManageMilestones ? 'Tạo milestone theo tuần để bắt đầu theo dõi tiến độ.' : 'Giảng viên hướng dẫn chưa tạo milestone cho nhóm.'}
              action={
                canManageMilestones && (
                  <div className="row">
                    <Button icon={Wand2} onClick={() => setModal('generate')}>
                      Sinh milestone theo tuần
                    </Button>
                    <Button variant="secondary" icon={Plus} onClick={() => setModal('createMilestone')}>
                      Tạo thủ công
                    </Button>
                  </div>
                )
              }
            />
          </Card>
        }
      >
        {() => (
          <>
            <div className="milestone-strip" role="tablist" aria-label="Milestone theo tuần">
              {sorted.map((m) => {
                const done = m.taskCounts?.DONE || 0
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={m.id === selectedId}
                    className={`milestone-chip ${m.id === selectedId ? 'is-selected' : ''} ${m.overdue ? 'is-overdue' : ''}`}
                    onClick={() => setPickedId(m.id)}
                    title={`${m.title} · hạn ${formatDateTime(m.dueAt)}`}
                  >
                    <span className="milestone-chip__week">Tuần {m.weekNumber}</span>
                    <span className="milestone-chip__count">
                      {done}/{m.totalTasks}
                    </span>
                  </button>
                )
              })}
            </div>

            {selected && (
              <Card>
                <CardBody>
                  <div className="row-between">
                    <div>
                      <h3>{selected.title}</h3>
                      <div className="text-small text-muted">
                        {formatDate(`${selected.startDate}T00:00:00+07:00`)} → hạn {formatDateTime(selected.dueAt)}
                        {selected.overdue && <span className="text-danger"> · Quá hạn, còn task chưa xong</span>}
                      </div>
                      {selected.description && <p className="text-small" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{selected.description}</p>}
                    </div>
                    <div className="row">
                      <Button variant="ghost" size="sm" icon={RefreshCw} onClick={refreshAll} loading={tasks.loading}>
                        Làm mới
                      </Button>
                      {canEditTasks && (
                        <Button size="sm" icon={ListPlus} onClick={() => setModal('createTask')}>
                          Thêm task
                        </Button>
                      )}
                      {canManageMilestones && (
                        <>
                          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setModal('editMilestone')}>
                            Sửa
                          </Button>
                          <Button variant="ghost" size="sm" iconOnly icon={Trash2} aria-label="Xoá milestone" onClick={() => setModal('deleteMilestone')} />
                          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setModal('createMilestone')}>
                            Milestone
                          </Button>
                          <Button variant="ghost" size="sm" icon={Wand2} onClick={() => setModal('generate')}>
                            Sinh theo tuần
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            <AsyncContent {...tasks} onRetry={tasks.reload} isEmpty={() => false}>
              {(list) => <KanbanBoard tasks={list} readOnly={!canEditTasks} busyIds={busyIds} onOpen={(t) => setOpenTaskId(t.id)} onMove={handleMove} />}
            </AsyncContent>
          </>
        )}
      </AsyncContent>

      {openTask && (
        <TaskModal
          key={openTask.id}
          task={openTask}
          members={members}
          readOnly={readOnly}
          renderSubmissions={renderTaskSubmissions}
          onClose={() => setOpenTaskId(null)}
          onChanged={(updated, options) => {
            if (updated) tasks.setData((list) => list.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
            if (!updated || options?.reload) refreshAll()
          }}
        />
      )}
      {modal === 'createTask' && selected && (
        <CreateTaskModal
          milestone={selected}
          members={members}
          onClose={() => setModal(null)}
          onCreated={() => {
            toast.success('Đã thêm task.')
            refreshAll()
          }}
        />
      )}
      {(modal === 'createMilestone' || modal === 'generate' || (modal === 'editMilestone' && selected)) && (
        <MilestoneFormModal
          mode={modal === 'generate' ? 'generate' : modal === 'editMilestone' ? 'edit' : 'create'}
          projectId={project.id}
          milestone={modal === 'editMilestone' ? selected : null}
          nextWeek={(sorted[sorted.length - 1]?.weekNumber || 0) + 1}
          onClose={() => setModal(null)}
          onSaved={milestones.reload}
        />
      )}
      <Modal
        open={modal === 'deleteMilestone' && !!selected}
        onClose={() => setModal(null)}
        busy={deleting}
        title={`Xoá ${selected?.title || 'milestone'}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={deleting}>
              Huỷ
            </Button>
            <Button variant="danger" loading={deleting} onClick={removeMilestone}>
              Xoá
            </Button>
          </>
        }
      >
        <p>Không xoá được nếu milestone đã có bài nộp.</p>
      </Modal>
    </div>
  )
}

export default MilestoneBoard
