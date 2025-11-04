/**
 * 通用配置相关类型定义
 */

/**
 * 通用配置项
 */
export interface GeneralSettings {
  id: number;
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
  page?: number;
  page_size?: number;
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

