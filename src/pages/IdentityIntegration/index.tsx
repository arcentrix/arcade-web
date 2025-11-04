import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Edit, Trash2, Power, PowerOff, Shield, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IdentityIntegrationConfigDialog } from '@/components/identity-integration-config-dialog'
import { toast } from '@/lib/toast'
import type { IdentityProvider, CreateIdentityProviderRequest, UpdateIdentityProviderRequest } from '@/api/identity_integration/types'
import { Apis } from '@/api'

export default function IdentityIntegrationPage() {
  const [providers, setProviders] = useState<IdentityProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<IdentityProvider | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      loadProviders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProviders = async () => {
    setLoading(true)
    try {
      const providers = await Apis.identity_integration.listIdentityProviders()
      setProviders(providers.sort((a, b) => a.priority - b.priority))
    } catch (error) {
      toast.error('Failed to load providers')
      console.error('Load failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedProvider(null)
    setDialogOpen(true)
  }

  const handleEdit = async (provider: IdentityProvider) => {
    try {
      // 调用详情接口获取完整的 provider 数据（包括 config）
      const fullProvider = await Apis.identity_integration.getIdentityProvider(provider.name)
      setSelectedProvider(fullProvider)
      setDialogOpen(true)
    } catch (error) {
      toast.error('Failed to load provider details')
      console.error('Load provider failed:', error)
    }
  }

  const handleSubmit = async (data: CreateIdentityProviderRequest) => {
    if (selectedProvider) {
      // 更新 - 编辑模式下不更新 is_enabled 状态，应通过页面上的 toggle 按钮控制
      const updateData: UpdateIdentityProviderRequest = {
        name: data.name,
        provider_type: data.provider_type,
        config: data.config,
        description: data.description,
        priority: data.priority,
      }
      await Apis.identity_integration.updateIdentityProvider(selectedProvider.name, updateData)
    } else {
      // 创建
      await Apis.identity_integration.createIdentityProvider(data)
    }
    await loadProviders()
  }

  const handleDelete = async (name: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return
    }

    try {
      await Apis.identity_integration.deleteIdentityProvider(name)
      toast.success('Provider deleted successfully')
      await loadProviders()
    } catch (error) {
      toast.error('Failed to delete provider')
      console.error('Delete failed:', error)
    }
  }

  const handleToggle = async (provider: IdentityProvider) => {
    try {
      await Apis.identity_integration.toggleIdentityProvider(provider.name, provider.isEnabled === 0)
      toast.success(provider.isEnabled === 1 ? 'Provider disabled' : 'Provider enabled')
      await loadProviders()
    } catch (error) {
      toast.error('Failed to toggle provider status')
      console.error('Toggle failed:', error)
    }
  }

  // 筛选逻辑
  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      // 按类型筛选
      if (filterType !== 'all' && provider.providerType !== filterType) {
        return false
      }
      
      // 按状态筛选
      if (filterStatus === 'enabled' && provider.isEnabled !== 1) {
        return false
      }
      if (filterStatus === 'disabled' && provider.isEnabled !== 0) {
        return false
      }
      
      // 按名称或描述搜索
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          provider.name.toLowerCase().includes(term) ||
          (provider.description && provider.description.toLowerCase().includes(term))
        )
      }
      
      return true
    })
  }, [providers, filterType, filterStatus, searchTerm])

  const getProviderTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      oauth: { label: 'OAuth 2.0', className: 'bg-sky-50 text-sky-600 border border-sky-200' },
      ldap: { label: 'LDAP', className: 'bg-purple-50 text-purple-600 border border-purple-200' },
      oidc: { label: 'OIDC', className: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
      saml: { label: 'SAML 2.0', className: 'bg-orange-50 text-orange-600 border border-orange-200' },
    }
    const variant = variants[type] || { label: type.toUpperCase(), className: 'bg-gray-100 text-gray-600 border border-gray-200' }
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
                <h2 className='text-3xl font-bold tracking-tight'>Identity Integration</h2>
                <p className='text-muted-foreground mt-2'>Manage identity authentication integration providers</p>
              </div>
              <Button onClick={handleCreate}>
                <Plus className='mr-2 h-4 w-4' />
                Add Provider
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <Shield className='h-5 w-5' />
                      Identity Providers
                    </CardTitle>
                    <CardDescription>Configure and manage supported identity providers (OAuth, LDAP, OIDC, SAML)</CardDescription>
                  </div>
                </div>
                
                {/* 筛选栏 */}
                <div className='flex gap-4 mt-4'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search by name or description...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Filter by type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='oauth'>OAuth 2.0</SelectItem>
                      <SelectItem value='ldap'>LDAP</SelectItem>
                      <SelectItem value='oidc'>OpenID Connect</SelectItem>
                      <SelectItem value='saml'>SAML 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className='w-[150px]'>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='enabled'>Enabled</SelectItem>
                      <SelectItem value='disabled'>Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <p className='text-muted-foreground'>Loading...</p>
                  </div>
                ) : filteredProviders.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <Shield className='h-12 w-12 text-muted-foreground mb-4' />
                    <p className='text-muted-foreground mb-4'>
                      {providers.length === 0 ? 'No identity providers configured' : 'No providers match your filters'}
                    </p>
                    {providers.length === 0 ? (
                      <Button onClick={handleCreate}>
                        <Plus className='mr-2 h-4 w-4' />
                        Add Your First Provider
                      </Button>
                    ) : (
                      <Button variant='outline' onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all') }}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProviders.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell className='font-medium'>{provider.name}</TableCell>
                          <TableCell>{getProviderTypeBadge(provider.providerType)}</TableCell>
                          <TableCell>
                            <Badge variant='outline' className='text-gray-500 border border-gray-200 bg-gray-50'>
                              {provider.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {provider.isEnabled === 1 ? (
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
                          <TableCell className='max-w-xs truncate'>{provider.description || '-'}</TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-2'>
                              <Button size='sm' variant='ghost' onClick={() => handleToggle(provider)}>
                                {provider.isEnabled === 1 ? (
                                  <PowerOff className='h-4 w-4' />
                                ) : (
                                  <Power className='h-4 w-4' />
                                )}
                              </Button>
                              <Button size='sm' variant='ghost' onClick={() => handleEdit(provider)}>
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => handleDelete(provider.name)}
                                className='text-red-500 hover:text-red-700'
                              >
                                <Trash2 className='h-4 w-4' />
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

      <IdentityIntegrationConfigDialog
        key={selectedProvider?.id || 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={selectedProvider}
        onSubmit={handleSubmit}
      />
    </>
  )
}

