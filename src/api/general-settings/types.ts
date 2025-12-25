/**
 * 通用配置相关类型定义
 */

/**
 * Settings ID 类型别名，UUID 格式的字符串
 */
export type SettingsId = string;

/**
 * 通用配置项
 * @property settingsId - Settings ID，UUID 格式的字符串，用于查询、更新、删除等操作
 */
export interface GeneralSettings {
  /** Settings ID，UUID 格式的字符串，所有基于此配置的操作都需要使用此 ID */
  settingsId: SettingsId;
  category: string;
  name: string;
  displayName: string;
  data: Record<string, any>;
  schema?: Record<string, any>;
  description?: string;
}

/**
 * 更新通用配置请求
 */
export interface UpdateGeneralSettingsRequest {
  displayName?: string;
  data?: Record<string, any>;
  schema?: Record<string, any>;
  description?: string;
}

/**
 * 通用配置列表请求参数
 */
export interface GetGeneralSettingsListRequest {
  category?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 通用配置列表响应
 */
export interface GetGeneralSettingsListResponse {
  list: GeneralSettings[];
  total: number;
  pageNum: number;
  pageSize: number;
}

/**
 * 类别响应
 */
export interface Category {
  category: string;
  count: number;
}

