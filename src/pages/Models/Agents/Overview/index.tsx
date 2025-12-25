/**
 * Agents Overview 页面
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Plus, Search, Trash2, Power, PowerOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AgentDialog } from '@/components/agent-dialog'
import { DataTablePagination } from '@/components/data-table-pagination'
import { toast } from '@/lib/toast'
import { Apis } from '@/api'
import type { Agent, CreateAgentRequest, UpdateAgentRequest, AgentStatus } from '@/api/agent/types'

export default function AgentsOverview() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [pageNum, setPageNum] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [createdAgentInfo, setCreatedAgentInfo] = useState<{ agentName: string; agentId: string; token: string } | null>(null)
  const loadingRef = useRef(false)
  const paramsRef = useRef<string>('')

  // 当搜索或筛选条件变化时，重置到第一页
  useEffect(() => {
    setPageNum(1)
  }, [searchTerm, filterStatus])

  // 统一的数据加载逻辑：当页码、搜索条件或筛选条件变化时加载
  useEffect(() => {
    // 如果有搜索或筛选条件，加载所有数据（使用较大的 pageSize）用于前端筛选
    // 否则使用正常的分页
    const params = searchTerm || filterStatus !== 'all'
      ? { pageNum: 1, pageSize: 1000 } // 加载足够多的数据用于前端筛选
      : { pageNum, pageSize }
    
    // 生成参数的唯一标识，用于防止重复请求
    const paramsKey = JSON.stringify(params)
    
    // 防止重复请求：如果正在加载或参数没有变化，则跳过
    if (loadingRef.current || paramsRef.current === paramsKey) {
      return
    }

    loadingRef.current = true
    paramsRef.current = paramsKey
    setLoading(true)
    
    Apis.agent.listAgents(params)
      .then((response) => {
        // 确保参数仍然匹配（防止快速切换导致的状态混乱）
        if (paramsRef.current === paramsKey) {
          setAgents(response.agents)
          setTotalCount(response.count)
        }
      })
      .catch((error) => {
        if (paramsRef.current === paramsKey) {
          toast.error('Failed to load agents')
          console.error('Load failed:', error)
        }
      })
      .finally(() => {
        if (paramsRef.current === paramsKey) {
          setLoading(false)
          loadingRef.current = false
        }
      })

    // 清理函数：当参数变化时，取消之前的请求
    return () => {
      if (paramsRef.current !== paramsKey) {
        loadingRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize, searchTerm, filterStatus])

  const handleCreate = () => {
    setSelectedAgent(null)
    setDialogOpen(true)
  }


  const handleDelete = (agent: Agent) => {
    setSelectedAgent(agent)
    setDeleteDialogOpen(true)
  }

  const reloadAgents = async () => {
    // 重置 ref 以允许重新加载
    paramsRef.current = ''
    loadingRef.current = false
    
    // 触发重新加载（通过触发 useEffect）
    const params = searchTerm || filterStatus !== 'all'
      ? { pageNum: 1, pageSize: 1000 }
      : { pageNum, pageSize }
    
    const paramsKey = JSON.stringify(params)
    loadingRef.current = true
    paramsRef.current = paramsKey
    setLoading(true)
    
    try {
      const response = await Apis.agent.listAgents(params)
      if (paramsRef.current === paramsKey) {
        setAgents(response.agents)
        setTotalCount(response.count)
      }
    } catch (error) {
      if (paramsRef.current === paramsKey) {
        toast.error('Failed to reload agents')
        console.error('Reload failed:', error)
      }
    } finally {
      if (paramsRef.current === paramsKey) {
        setLoading(false)
        loadingRef.current = false
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedAgent) return

    try {
      await Apis.agent.deleteAgent(selectedAgent.agentId)
      toast.success('Agent deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedAgent(null)
      await reloadAgents()
    } catch (error) {
      toast.error('Failed to delete agent')
      console.error('Delete failed:', error)
    }
  }

  const handleSubmit = async (data: CreateAgentRequest | UpdateAgentRequest) => {
    try {
      if (selectedAgent) {
        // 更新 Agent
        await Apis.agent.updateAgent(selectedAgent.agentId, data as UpdateAgentRequest)
        await reloadAgents()
      } else {
        // 创建 Agent
        const response = await Apis.agent.createAgent(data as CreateAgentRequest)
        // 显示成功对话框，包含 name、id 和 token
        setCreatedAgentInfo({
          agentName: response.agentName,
          agentId: response.agentId,
          token: response.token,
        })
        setShowTokenDialog(true)
        await reloadAgents()
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await Apis.agent.updateAgent(agent.agentId, { isEnabled: agent.isEnabled === 1 ? 0 : 1 })
      toast.success(agent.isEnabled === 1 ? 'Agent disabled' : 'Agent enabled')
      await reloadAgents()
    } catch (error) {
      toast.error('Failed to toggle agent status')
      console.error('Toggle failed:', error)
    }
  }

  // 过滤和搜索
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.address.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === 'all' || agent.status.toString() === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [agents, searchTerm, filterStatus])

  // 获取状态 Badge
  const getStatusBadge = (status: AgentStatus) => {
    const statusMap = {
      0: { label: 'Unknown', className: 'bg-gray-100 text-gray-600 border-gray-200' },
      1: { label: 'Online', className: 'bg-green-50 text-green-600 border-green-200' },
      2: { label: 'Offline', className: 'bg-red-50 text-red-600 border-red-200' },
      3: { label: 'Busy', className: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
      4: { label: 'Idle', className: 'bg-blue-50 text-blue-600 border-blue-200' },
    }

    const variant = statusMap[status] || statusMap[0]

    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  // 如果有搜索或筛选条件，使用前端筛选后的结果进行分页
  // 否则使用服务端分页
  const hasFilters = searchTerm || filterStatus !== 'all'
  const totalPages = hasFilters 
    ? Math.ceil(filteredAgents.length / pageSize)
    : Math.ceil(totalCount / pageSize)
  
  // 如果有筛选条件，使用前端分页；否则使用服务端分页
  const displayAgents = hasFilters 
    ? filteredAgents.slice((pageNum - 1) * pageSize, pageNum * pageSize)
    : filteredAgents

  return (
    <>
      <section className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Agents
            </h2>
            <p className="text-muted-foreground mt-2">Manage and monitor your agent nodes</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Agent List
                </CardTitle>
                <CardDescription>View and manage all agent nodes</CardDescription>
              </div>
            </div>

            {/* 筛选栏 */}
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="1">Online</SelectItem>
                  <SelectItem value="2">Offline</SelectItem>
                  <SelectItem value="3">Busy</SelectItem>
                  <SelectItem value="4">Idle</SelectItem>
                  <SelectItem value="0">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {agents.length === 0 ? 'No agents found' : 'No agents match your filters'}
                </p>
                {agents.length === 0 ? (
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Agent
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterStatus('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Agent ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>OS / Arch</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAgents.map((agent) => (
                      <TableRow 
                        key={`agent-${agent.agentId}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/agents/${agent.agentId}`)}
                      >
                        <TableCell>
                          <div className="font-medium">{agent.agentName}</div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{agent.agentId}</code>
                        </TableCell>
                        <TableCell>
                          {agent.address && agent.port ? `${agent.address}:${agent.port}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{agent.os}</div>
                            <div className="text-muted-foreground">{agent.arch}</div>
                          </div>
                        </TableCell>
                        <TableCell>{agent.version || '-'}</TableCell>
                        <TableCell>{getStatusBadge(agent.status)}</TableCell>
                        <TableCell>
                          {agent.isEnabled === 1 ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                              <Power className="mr-1 h-3 w-3" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                              <PowerOff className="mr-1 h-3 w-3" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(agent)}
                              title={agent.isEnabled === 1 ? 'Disable' : 'Enable'}
                            >
                              {agent.isEnabled === 1 ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(agent)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <DataTablePagination
                      page={pageNum}
                      pageSize={pageSize}
                      total={hasFilters ? filteredAgents.length : totalCount}
                      onPageChange={setPageNum}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <AgentDialog
        key={selectedAgent?.agentId || 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={selectedAgent}
        onSubmit={handleSubmit}
      />

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agent &quot;{selectedAgent?.agentName}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent 创建成功对话框 */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Created Successfully</DialogTitle>
            <DialogDescription>
              Please save the following information securely. The token will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <div className="relative">
                <Input
                  value={createdAgentInfo?.agentName || ''}
                  readOnly
                  className="font-medium pr-10"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => createdAgentInfo && handleCopy(createdAgentInfo.agentName, 'name')}
                >
                  {copiedField === 'name' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Agent ID */}
            <div className="space-y-2">
              <Label>Agent ID</Label>
              <div className="relative">
                <Input
                  value={createdAgentInfo?.agentId || ''}
                  readOnly
                  className="font-mono text-sm pr-10"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => createdAgentInfo && handleCopy(createdAgentInfo.agentId, 'id')}
                >
                  {copiedField === 'id' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Token */}
            <div className="space-y-2">
              <Label>Token</Label>
              <div className="relative">
                <Input
                  value={createdAgentInfo?.token || ''}
                  readOnly
                  className="font-mono text-sm pr-10"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => createdAgentInfo?.token && handleCopy(createdAgentInfo.token, 'token')}
                >
                  {copiedField === 'token' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Warning: If you lose this token, you will need to recreate the agent.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>I&apos;ve Saved It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
