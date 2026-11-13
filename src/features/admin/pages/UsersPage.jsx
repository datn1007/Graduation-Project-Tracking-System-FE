import React, { useState } from 'react'
import { KeyRound, Pencil, Search, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { useDebounce } from '../../../hooks/useDebounce'
import { PageHeader, Pagination, Avatar } from '../../../components/ui/Misc'
import { Card, CardBody } from '../../../components/ui/Card'
import { Badge, EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import { formatDateTime } from '../../../utils/format'
import { getDepartments, getUsers } from '../admin.service'
import { USERS_PAGE_SIZE } from '../admin.constants'
import UserFormModal from '../components/UserFormModal'
import SetPasswordModal from '../components/SetPasswordModal'
import SignInMethods from '../components/SignInMethods'

const UsersPage = () => {
  const { user: me } = useAuth()
  const { options } = useMeta()
  const [q, setQ] = useState('')
  const query = useDebounce(q)
  const [role, setRole] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null) // null | {} (new) | user
  const [passwordFor, setPasswordFor] = useState(null)
  const departments = useAsync(() => getDepartments(), [])
  const users = useAsync(
    () => getUsers({ q: query.trim() || undefined, role: role || undefined, active: active === '' ? undefined : active === 'true', page, size: USERS_PAGE_SIZE, sort: 'fullName,asc' }),
    [query, role, active, page],
  )
  const reset = (setter) => (e) => {
    setter(e.target.value)
    setPage(0)
  }

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Thêm người dùng (mọi email, kể cả Gmail) để cấp quyền đăng nhập, đổi vai trò, cấp / reset mật khẩu, vô hiệu hoá tài khoản."
        actions={
          <Button icon={UserPlus} onClick={() => setEditing({})}>
            Thêm người dùng
          </Button>
        }
      />
      <Card>
        <div className="card__header">
          <div className="toolbar" style={{ width: '100%' }}>
            <div className="input-icon">
              <Search aria-hidden="true" />
              <input className="input" type="search" placeholder="Tìm theo email, tên, mã…" aria-label="Tìm người dùng" value={q} onChange={reset(setQ)} />
            </div>
            <select className="select" aria-label="Vai trò" value={role} onChange={reset(setRole)}>
              <option value="">Mọi vai trò</option>
              {options('role').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select className="select" aria-label="Trạng thái" value={active} onChange={reset(setActive)}>
              <option value="">Mọi trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã vô hiệu hoá</option>
            </select>
          </div>
        </div>
        <CardBody flush>
          <AsyncContent {...users} onRetry={users.reload} empty={<EmptyState icon={Users} title="Không tìm thấy người dùng" />}>
            {(data) => (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Người dùng</th>
                        <th scope="col">Vai trò</th>
                        <th scope="col">Bộ môn</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col">Đăng nhập bằng</th>
                        <th scope="col">Đăng nhập gần nhất</th>
                        <th scope="col">
                          <span className="sr-only">Thao tác</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.content.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="row" style={{ flexWrap: 'nowrap' }}>
                              <Avatar name={u.fullName} size="sm" />
                              <div>
                                <div className="table__primary">
                                  {u.fullName} {u.id === me.id && <Badge tone="primary">Bạn</Badge>}
                                </div>
                                <div className="table__secondary">
                                  {u.email}
                                  {u.userCode && ` · ${u.userCode}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <EnumBadge name="role" value={u.role} />
                          </td>
                          <td>{u.department?.code || '—'}</td>
                          <td>{u.active ? <Badge tone="success">Hoạt động</Badge> : <Badge>Vô hiệu hoá</Badge>}</td>
                          <td>
                            <SignInMethods user={u} />
                          </td>
                          <td className="text-small text-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Chưa đăng nhập'}</td>
                          <td>
                            <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                              <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(u)}>
                                Sửa
                              </Button>
                              <Button variant="ghost" size="sm" icon={KeyRound} onClick={() => setPasswordFor(u)}>
                                {u.hasPassword ? 'Reset mật khẩu' : 'Cấp mật khẩu'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination pageData={data} onPageChange={setPage} />
              </>
            )}
          </AsyncContent>
        </CardBody>
      </Card>
      {passwordFor && <SetPasswordModal user={passwordFor} onClose={() => setPasswordFor(null)} onSaved={users.reload} />}
      {editing && <UserFormModal user={editing.id ? editing : null} departments={departments.data || []} onClose={() => setEditing(null)} onSaved={users.reload} />}
    </>
  )
}

export default UsersPage
