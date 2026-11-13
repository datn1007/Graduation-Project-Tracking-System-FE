import React, { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { EnumBadge } from '../../../components/ui/Badge'
import { Alert, Tabs } from '../../../components/ui/Misc'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../../hooks/useAuth'
import { useMeta } from '../../../hooks/useMeta'
import { useToast } from '../../../hooks/useToast'
import { PERMISSIONS as P } from '../../../constants/enums'
import { formatDateTime } from '../../../utils/format'
import { deleteTask, getTaskHistory, updateTask } from '../kanban.service'
import '../kanban.scss'

export const TaskFields = ({ form, setForm, errors, members }) => {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  return (
    <>
      <FormField label="Tiêu đề" required error={errors.title}>
        <input className="input" maxLength={255} value={form.title} onChange={set('title')} data-autofocus />
      </FormField>
      <FormField label="Mô tả" error={errors.description}>
        <textarea className="textarea" maxLength={10000} value={form.description} onChange={set('description')} />
      </FormField>
      <FormField label="Người thực hiện" error={errors.assigneeId}>
        <select className="select" value={form.assigneeId} onChange={set('assigneeId')}>
          <option value="">— Chưa giao —</option>
          {members.map((m) => (
            <option key={m.student.id} value={m.student.id}>
              {m.student.fullName}
              {m.leader ? ' (trưởng nhóm)' : ''}
            </option>
          ))}
        </select>
      </FormField>
    </>
  )
}

// `renderSubmissions({ task, readOnly, onSubmitted })` is injected by app/routes (submission feature),
// so kanban never imports another feature.
const TaskModal = ({ task, members, readOnly, onClose, onChanged, renderSubmissions }) => {
  const { can } = useAuth()
  const { label } = useMeta()
  const toast = useToast()
  const [tab, setTab] = useState('submissions')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: task.title, description: task.description || '', assigneeId: task.assignee?.id || '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const history = useAsync(() => (tab === 'history' ? getTaskHistory(task.id) : Promise.resolve(undefined)), [task.id, tab])
  const canEdit = can(P.TASK_EDIT) && !readOnly

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    if (!form.title.trim()) return setErrors({ title: 'Vui lòng nhập tiêu đề.' })
    setSaving(true)
    setFormError(null)
    try {
      const updated = await updateTask(task.id, { title: form.title.trim(), description: form.description.trim() || undefined, assigneeId: form.assigneeId || undefined })
      toast.success('Đã cập nhật task.')
      setEditing(false)
      onChanged(updated)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await deleteTask(task.id)
      toast.success('Đã xoá task.')
      onChanged(null)
      onClose()
    } catch (err) {
      toast.error(err.message)
      setConfirmDelete(false)
    } finally {
      setSaving(false)
    }
  }


  return (
    <Modal open onClose={onClose} busy={saving} size="lg" title={task.title} description={task.assignee ? `Giao cho ${task.assignee.fullName}` : 'Chưa giao'}>
      <div className="task-detail">
        <div className="task-detail__meta">
          <EnumBadge name="taskStatus" value={task.status} />
          {task.hasLateSubmission && <span className="badge badge--danger">Có bài nộp trễ</span>}
          <span className="text-muted text-small">
            Tạo bởi {task.createdBy?.fullName} · cập nhật {formatDateTime(task.updatedAt)}
          </span>
        </div>

        {!editing && task.description && <p className="task-detail__description">{task.description}</p>}

        {canEdit && !editing && !confirmDelete && (
          <div className="row">
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
              Sửa task
            </Button>
            <Button variant="danger-outline" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>
              Xoá
            </Button>
          </div>
        )}
        {confirmDelete && (
          <Alert tone="warning" title="Xoá task này?">
            Không xoá được nếu task đã có bài nộp.
            <div className="row" style={{ marginTop: 8 }}>
              <Button variant="danger" size="sm" loading={saving} onClick={remove}>
                Xoá
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                Huỷ
              </Button>
            </div>
          </Alert>
        )}
        {editing && (
          <form className="inline-form" onSubmit={save} noValidate>
            {formError && <Alert tone="danger">{formError}</Alert>}
            <TaskFields form={form} setForm={setForm} errors={errors} members={members} />
            <div className="row">
              <Button type="submit" loading={saving}>
                Lưu
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                Huỷ
              </Button>
            </div>
          </form>
        )}

        <Tabs
          label="Thông tin task"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'submissions', label: 'Bài nộp & nhận xét', count: task.submissionCount },
            { value: 'history', label: 'Lịch sử' },
          ]}
        />

        {tab === 'submissions' && (
          <section className="task-detail__section">
            {renderSubmissions ? (
              renderSubmissions({
                task,
                readOnly,
                // A submission moves TODO / IN_PROGRESS → REVIEW on the Backend; reload the board.
                onSubmitted: (submission) =>
                  onChanged(
                    { ...task, submissionCount: (task.submissionCount || 0) + 1, hasLateSubmission: task.hasLateSubmission || submission.late },
                    { reload: true },
                  ),
              })
            ) : (
              <EmptyState compact title="Chưa có bài nộp" />
            )}
          </section>
        )}

        {tab === 'history' && (
          <AsyncContent {...history} onRetry={history.reload} compact empty={<EmptyState compact title="Chưa có lịch sử" />}>
            {(list) => (
              <ul className="timeline">
                {list.map((h) => (
                  <li key={h.id}>
                    {h.fromStatus ? `${label('taskStatus', h.fromStatus)} → ` : ''}
                    <strong>{label('taskStatus', h.toStatus)}</strong> · {h.actor?.fullName}
                    <span className="text-muted"> · {formatDateTime(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </AsyncContent>
        )}
      </div>
    </Modal>
  )
}

export default TaskModal
