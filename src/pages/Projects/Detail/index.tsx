/**
 * Project Detail 布局页面 - 作为项目子页面的布局容器
 */

import type { FC } from 'react'
import { useParams, Outlet, useLocation, Link } from 'react-router-dom'
import { Frame } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ProjectDetail: FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  
  // 根据当前路径确定 active tab
  const getActiveTab = () => {
    if (location.pathname.includes('/pipelines/runs')) return 'runs'
    if (location.pathname.endsWith('/pipelines') || location.pathname.includes('/pipelines/')) return 'pipelines'
    if (location.pathname.endsWith('/deployments')) return 'deployments'
    if (location.pathname.endsWith('/environments')) return 'environments'
    if (location.pathname.endsWith('/secrets')) return 'secrets'
    if (location.pathname.endsWith('/artifacts')) return 'artifacts'
    if (location.pathname.endsWith('/settings')) return 'settings'
    if (location.pathname.endsWith('/members')) return 'members'
    return 'overview'
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Frame className="h-8 w-8 text-blue-500" />
            Project {projectId}
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage project resources and configurations
          </p>
        </div>
      </div>

      <Tabs value={getActiveTab()} className="w-full">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link to={`/projects/${projectId}`}>Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="pipelines" asChild>
            <Link to={`/projects/${projectId}/pipelines`}>Pipelines</Link>
          </TabsTrigger>
          <TabsTrigger value="runs" asChild>
            <Link to={`/projects/${projectId}/pipelines/runs`}>Runs</Link>
          </TabsTrigger>
          <TabsTrigger value="deployments" asChild>
            <Link to={`/projects/${projectId}/deployments`}>Deployments</Link>
          </TabsTrigger>
          <TabsTrigger value="environments" asChild>
            <Link to={`/projects/${projectId}/environments`}>Environments</Link>
          </TabsTrigger>
          <TabsTrigger value="secrets" asChild>
            <Link to={`/projects/${projectId}/secrets`}>Secrets</Link>
          </TabsTrigger>
          <TabsTrigger value="artifacts" asChild>
            <Link to={`/projects/${projectId}/artifacts`}>Artifacts</Link>
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <Link to={`/projects/${projectId}/settings`}>Settings</Link>
          </TabsTrigger>
          <TabsTrigger value="members" asChild>
            <Link to={`/projects/${projectId}/members`}>Members</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  )
}

export default ProjectDetail
