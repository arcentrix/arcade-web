/**
 * Agent API 类型定义
 */

// Agent 状态枚举
export type AgentStatus = 0 | 1 | 2 | 3 | 4

export const AgentStatusMap = {
  0: 'unknown',
  1: 'online',
  2: 'offline',
  3: 'busy',
  4: 'idle',
} as const

// Agent 数据模型
export interface Agent {
  id: number // 数据库自增ID（内部使用）
  agentId: string // Agent唯一标识（短ID）
  agentName: string // Agent名称
  address: string // Agent地址
  port: string // Agent端口
  os: string // 操作系统（如：Linux、Windows、macOS）
  arch: string // 架构（如：amd64、arm64）
  version: string // Agent版本
  status: AgentStatus // Agent状态：0-unknown, 1-online, 2-offline, 3-busy, 4-idle
  labels: Record<string, string> // 标签（JSON对象）
  metrics: string // 指标路径（如：/metrics）
  isEnabled: number // 是否启用：0-禁用, 1-启用
}

// 创建 Agent 请求
export interface CreateAgentRequest {
  agentName: string
  status?: AgentStatus
  labels?: Record<string, string>
}

// 创建 Agent 响应（包含 token）
export interface CreateAgentResponse extends Agent {
  token: string // Agent 通信认证 Token
}

// 更新 Agent 请求
export interface UpdateAgentRequest {
  agentName?: string
  address?: string
  port?: string
  os?: string
  arch?: string
  version?: string
  status?: AgentStatus
  labels?: Record<string, string>
  metrics?: string
  isEnabled?: number
}

// Agent 列表查询参数
export interface ListAgentsParams {
  pageNum?: number
  pageSize?: number
}

// Agent 列表响应
export interface ListAgentsResponse {
  agents: Agent[]
  count: number
  pageNum: number
  pageSize: number
}

