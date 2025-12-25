/**
 * Projects 列表页面 - 显示所有项目，可以创建新项目
 */

import { useState, useMemo, useEffect } from 'react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { Frame, Plus, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTablePagination } from '@/components/data-table-pagination'

const Projects: FC = () => {
  // 示例项目数据
  const [projects] = useState([
    { id: '1', name: 'Project A', description: 'Main project for production', pipelines: 12, deployments: 5 },
    { id: '2', name: 'Project B', description: 'Secondary project for testing', pipelines: 8, deployments: 3 },
    { id: '3', name: 'Project C', description: 'Development project', pipelines: 5, deployments: 2 },
    { id: '4', name: 'Project D', description: 'Testing project', pipelines: 3, deployments: 1 },
    { id: '5', name: 'Project E', description: 'Staging project', pipelines: 7, deployments: 4 },
    { id: '6', name: 'Project F', description: 'Demo project', pipelines: 2, deployments: 0 },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [pageSize] = useState(6)

  // 筛选逻辑
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          project.name.toLowerCase().includes(term) ||
          project.description.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [projects, searchTerm])

  // 分页计算
  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const paginatedProjects = useMemo(() => {
    const startIndex = (pageNum - 1) * pageSize
    return filteredProjects.slice(startIndex, startIndex + pageSize)
  }, [filteredProjects, pageNum, pageSize])

  // 当搜索条件变化时，重置到第一页
  useEffect(() => {
    setPageNum(1)
  }, [searchTerm])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Frame className="h-8 w-8 text-blue-500" />
            Projects
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your projects and create new ones
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProjects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="group">
            <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Frame className="h-5 w-5 text-blue-500" />
                  {project.name}
                </CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pipelines</span>
                    <span className="font-medium">{project.pipelines}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deployments</span>
                    <span className="font-medium">{project.deployments}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">View Details</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="pt-4 border-t">
          <DataTablePagination
            page={pageNum}
            pageSize={pageSize}
            total={filteredProjects.length}
            onPageChange={setPageNum}
          />
        </div>
      )}
    </div>
  )
}

export default Projects
