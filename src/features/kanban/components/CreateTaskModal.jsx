import React, { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Misc'
import { createTask } from '../kanban.service'
import { TaskFields } from './TaskModal'

// POST /milestones/{id}/tasks { title, description?, assigneeId? } → new task lands in TODO.
const CreateTaskModal = ({ milestone, members, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', assigneeId: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    if (!form.title.trim()) return setErrors({ title: 'Vui lòng nhập tiêu đề.' })
    setSaving(true)
    setFormError(null)
    try {
      const task = await createTask(milestone.id, { title: form.title.trim(), description: form.description.trim() || undefined, assigneeId: form.assigneeId || undefined })
      onCreated(task)
      onClose()
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      title="Thêm task"
      description={`${milestone.title} · task mới nằm ở cột Cần làm`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="task-create-form" loading={saving}>
            Tạo task
          </Button>
        </>
      }
    >
      <form id="task-create-form" className="stack" onSubmit={submit} noValidate>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <TaskFields form={form} setForm={setForm} errors={errors} members={members} />
      </form>
    </Modal>
  )
}

export default CreateTaskModal
