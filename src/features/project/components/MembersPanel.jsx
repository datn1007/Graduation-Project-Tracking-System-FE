import React, { useState } from 'react'
import { Crown, Search, UserMinus, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../hooks/useToast'
import { useDebounce } from '../../../hooks/useDebounce'
import { PERMISSIONS as P } from '../../../constants/enums'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Avatar } from '../../../components/ui/Misc'
import { EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import { formatDate } from '../../../utils/format'
import { addMember, removeMember, searchStudents, setLeader } from '../project.service'

// Members of a group; PROJECT_MANAGE can add / remove / change leader.
const MembersPanel = ({ project, onChanged }) => {
  const { can } = useAuth()
  const toast = useToast()
  const manage = can(P.PROJECT_MANAGE) && can(P.USER_MANAGE)
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query)
  const [busy, setBusy] = useState(null)
  const candidates = useAsync(
    () => (manage && debounced.trim() ? searchStudents(debounced.trim(), project.term?.id) : Promise.resolve(undefined)),
    [manage, debounced, project.term?.id],
  )
  const memberIds = new Set(project.members.map((m) => m.student.id))

  const run = async (key, action, message) => {
    setBusy(key)
    try {
      const updated = await action()
      toast.success(message)
      onChanged(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader icon={Users} title={`Thành viên (${project.members.length})`} subtitle="Thành viên đầu tiên tự thành trưởng nhóm" />
      <CardBody flush>
        {project.members.length === 0 ? (
          <EmptyState compact title="Nhóm chưa có thành viên" />
        ) : (
          <div className="list">
            {project.members.map((m) => (
              <div key={m.student.id} className="list-item">
                <Avatar name={m.student.fullName} size="sm" />
                <div className="list-item__body">
                  <div className="list-item__title">
                    {m.student.fullName} {m.leader && <Badge tone="warning" icon={Crown}>Trưởng nhóm</Badge>}
                  </div>
                  <div className="list-item__meta">
                    <span>{m.student.userCode}</span>
                    <span>{m.student.email}</span>
                    <span>Tham gia {formatDate(m.joinedAt)}</span>
                  </div>
                </div>
                {manage && (
                  <div className="row" style={{ gap: 4 }}>
                    {!m.leader && (
                      <Button variant="ghost" size="sm" icon={Crown} loading={busy === `lead-${m.student.id}`} onClick={() => run(`lead-${m.student.id}`, () => setLeader(project.id, m.student.id), `${m.student.fullName} là trưởng nhóm.`)}>
                        Đặt trưởng nhóm
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" iconOnly icon={UserMinus} aria-label={`Xoá ${m.student.fullName} khỏi nhóm`} loading={busy === `rm-${m.student.id}`} onClick={() => run(`rm-${m.student.id}`, () => removeMember(project.id, m.student.id), `Đã xoá ${m.student.fullName} khỏi nhóm.`)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
      {manage && (
        <div className="card__footer stack-sm">
          <div className="input-icon">
            <Search aria-hidden="true" />
            <input className="input" type="search" placeholder="Tìm sinh viên chưa có nhóm (tên, email, mã SV) để thêm…" aria-label="Tìm sinh viên" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {candidates.data?.filter((u) => !memberIds.has(u.id)).map((u) => (
            <div key={u.id} className="row-between">
              <span className="text-small">
                <strong>{u.fullName}</strong> · {u.userCode} · {u.email}
              </span>
              <Button size="sm" variant="secondary" icon={UserPlus} loading={busy === `add-${u.id}`} onClick={() => run(`add-${u.id}`, () => addMember(project.id, u.id), `Đã thêm ${u.fullName}.`)}>
                Thêm
              </Button>
            </div>
          ))}
          {candidates.error && <span className="text-small text-danger">{candidates.error.message}</span>}
        </div>
      )}
    </Card>
  )
}

export default MembersPanel
