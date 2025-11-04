import { useState, useEffect, useMemo, useRef } from 'react'
import { Edit, Users as UsersIcon, Search, Shield, Mail, UserPlus, Lock, Power, PowerOff, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserManagementDialog } from '@/components/user-management-dialog'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { DEFAULT_USER_AVATAR } from '@/constants/assets'
import type { User, UpdateUserRequest } from '@/api/user-management/types'
import type { Role } from '@/api/role/types'
import { Apis } from '@/api'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('')
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      loadUsers()
      loadRoles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await Apis.user_management.listUsers()
      setUsers(response.users)
    } catch (error) {
      toast.error('Failed to load users')
      console.error('Load failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await Apis.role.listRoles(1, 100) // 获取所有角色
      setRoles(response.roles)
      // 设置默认角色为第一个可用角色
      if (response.roles.length > 0 && !inviteRole) {
        setInviteRole(response.roles[0].roleId)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setResetPasswordDialogOpen(true)
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await Apis.user_management.updateUser(user.userId, { isEnabled: user.isEnabled === 0 ? 1 : 0 })
      toast.success(user.isEnabled === 1 ? 'User disabled' : 'User enabled')
      await loadUsers()
    } catch (error) {
      toast.error('Failed to toggle user status')
      console.error('Toggle failed:', error)
    }
  }

  const handleSubmit = async (data: UpdateUserRequest) => {
    if (selectedUser) {
      await Apis.user_management.updateUser(selectedUser.userId, data)
    }
    await loadUsers()
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }

    try {
      await Apis.user_management.inviteUser({ email: inviteEmail, role: inviteRole as any })
      toast.success('Invitation sent successfully')
      setInviteEmail('')
      setInviteRole('user')
      setInviteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to send invitation')
      console.error('Invite failed:', error)
    }
  }

  // 筛选逻辑
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 按角色筛选
      if (filterRole !== 'all' && user.role !== filterRole) {
        return false
      }

      // 按状态筛选
      if (filterStatus === 'active' && user.isEnabled !== 1) {
        return false
      }
      if (filterStatus === 'inactive' && user.isEnabled !== 0) {
        return false
      }

      // 按搜索词筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.firstName && user.firstName.toLowerCase().includes(term)) ||
          (user.lastName && user.lastName.toLowerCase().includes(term))
        )
      }

      return true
    })
  }, [users, filterRole, filterStatus, searchTerm])

  const getRoleBadge = (roleId: string) => {
    const role = roles.find((r) => r.roleId === roleId || r.name === roleId)
    
    if (!role) {
      return (
        <Badge variant='outline' className='bg-gray-100 text-gray-600 border border-gray-200'>
          <Shield className='mr-1 h-3 w-3' />
          {roleId}
        </Badge>
      )
    }

    // 根据角色类型选择图标
    const Icon = role.isBuiltin === 1 ? Crown : Shield
    
    // 统一使用柔和配色
    const getColorClass = () => {
      if (role.priority >= 50) {
        return 'bg-rose-50 text-rose-600 border border-rose-200' // 高优先级（所有者）
      } else if (role.priority >= 40) {
        return 'bg-amber-50 text-amber-600 border border-amber-200' // 中高优先级（管理员/维护者）
      } else if (role.priority >= 30) {
        return 'bg-sky-50 text-sky-600 border border-sky-200' // 中等优先级（开发者）
      } else {
        return 'bg-gray-100 text-gray-600 border border-gray-200' // 低优先级（报告者等）
      }
    }

    return (
      <Badge variant='outline' className={getColorClass()}>
        <Icon className='mr-1 h-3 w-3' />
        {role.displayName || role.name}
      </Badge>
    )
  }

  const getInvitationStatusBadge = (status?: string) => {
    if (!status) return null
    
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border border-amber-200' },
      accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
      revoked: { label: 'Revoked', className: 'bg-rose-50 text-rose-600 border border-rose-200' },
    }
    const variant = variants[status] || { label: status, className: 'bg-gray-100 text-gray-600 border border-gray-200' }
    return (
      <Badge variant='outline' className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <>
      <section className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-3xl font-bold tracking-tight'>User Management</h2>
                <p className='text-muted-foreground mt-2'>Manage system users and their permissions</p>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Mail className='mr-2 h-4 w-4' />
                Invite User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <UsersIcon className='h-5 w-5' />
                      Users
                    </CardTitle>
                    <CardDescription>View and manage all system users</CardDescription>
                  </div>
                </div>

                {/* 筛选栏 */}
                <div className='flex gap-4 mt-4'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search by username, email, or name...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Filter by role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.displayName || role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className='w-[150px]'>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <p className='text-muted-foreground'>Loading...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <UsersIcon className='h-12 w-12 text-muted-foreground mb-4' />
                    <p className='text-muted-foreground mb-4'>
                      {users.length === 0 ? 'No users found' : 'No users match your filters'}
                    </p>
                    {users.length === 0 ? (
                      <Button onClick={() => setInviteDialogOpen(true)}>
                        <Mail className='mr-2 h-4 w-4' />
                        Invite Your First User
                      </Button>
                    ) : (
                      <Button
                        variant='outline'
                        onClick={() => {
                          setSearchTerm('')
                          setFilterRole('all')
                          setFilterStatus('all')
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invitation</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8'>
                                <AvatarImage src={user.avatar || DEFAULT_USER_AVATAR} />
                                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className='font-medium'>{user.username}</div>
                                {(user.firstName || user.lastName) && (
                                  <div className='text-sm text-muted-foreground'>
                                    {user.firstName} {user.lastName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                          <TableCell>
                            {user.isEnabled === 1 ? (
                              <Badge variant='outline' className='bg-emerald-50 text-emerald-600 border border-emerald-200'>
                                <Power className='mr-1 h-3 w-3' />
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='bg-gray-100 text-gray-500 border border-gray-200'>
                                <PowerOff className='mr-1 h-3 w-3' />
                                Disabled
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getInvitationStatusBadge(user.invitationStatus)}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {user.lastLoginAt && user.lastLoginAt !== 'null'
                              ? (() => {
                                  const date = new Date(user.lastLoginAt)
                                  const year = date.getFullYear()
                                  const month = date.getMonth() + 1
                                  const day = date.getDate()
                                  const hours = date.getHours().toString().padStart(2, '0')
                                  const minutes = date.getMinutes().toString().padStart(2, '0')
                                  const seconds = date.getSeconds().toString().padStart(2, '0')
                                  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
                                })()
                              : '-'}
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-2'>
                              <Button size='sm' variant='ghost' onClick={() => handleToggleStatus(user)}>
                                {user.isEnabled === 1 ? (
                                  <PowerOff className='h-4 w-4' />
                                ) : (
                                  <Power className='h-4 w-4' />
                                )}
                              </Button>
                              <Button size='sm' variant='ghost' onClick={() => handleResetPassword(user)}>
                                <Lock className='h-4 w-4' />
                              </Button>
                              <Button size='sm' variant='ghost' onClick={() => handleEdit(user)}>
                                <Edit className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
      </section>

      <UserManagementDialog
        key={selectedUser?.userId || 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        roles={roles}
        onSubmit={handleSubmit}
      />

      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
        userId={selectedUser?.userId || null}
        username={selectedUser?.username || null}
      />

      {/* 邀请用户对话框 */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation email to a new user</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='inviteEmail'>Email *</Label>
              <Input
                id='inviteEmail'
                type='email'
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder='user@example.com'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='inviteRole'>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id='inviteRole'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => {
                    const scopeLabel = role.scope === 'org' ? 'Organization' : role.scope === 'team' ? 'Team' : role.scope === 'project' ? 'Project' : role.scope
                    return (
                      <SelectItem key={role.roleId} value={role.roleId}>
                        {role.displayName || role.name} ({scopeLabel})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>
              <UserPlus className='h-4 w-4 mr-1' />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

