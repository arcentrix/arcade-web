/**
 * 通用配置相关 API
 */

import { get, put, dedupeRequest, generateRequestKey } from '../client';
import type {
  GeneralSettings,
  SettingsId,
  UpdateGeneralSettingsRequest,
  GetGeneralSettingsListRequest,
  GetGeneralSettingsListResponse,
  Category,
} from './types';

/**
 * 获取通用配置列表
 */
export async function getGeneralSettingsList(
  params?: GetGeneralSettingsListRequest
): Promise<GetGeneralSettingsListResponse> {
  const url = '/general-settings'
  // 使用请求去重
  const key = generateRequestKey(url, params)
  return dedupeRequest(key, () => get<GetGeneralSettingsListResponse>(url, { params }))
}

/**
 * 获取所有类别
 */
export async function getCategories(): Promise<Category[]> {
  return await get<Category[]>(
    '/general-settings/categories'
  );
}

/**
 * 根据 settingsId 获取通用配置详情
 * @param settingsId - 配置项的 ID（UUID 格式字符串，从 GeneralSettings.settingsId 获取）
 * @returns 通用配置详情
 */
export async function getGeneralSettings(settingsId: SettingsId): Promise<GeneralSettings> {
  const url = `/general-settings/${settingsId}`
  // 使用请求去重
  const key = generateRequestKey(url)
  return dedupeRequest(key, () => get<GeneralSettings>(url))
}

/**
 * 根据 settingsId 更新通用配置
 * @param settingsId - 配置项的 ID（UUID 格式字符串，从 GeneralSettings.settingsId 获取）
 * @param data - 要更新的配置数据
 * @returns 更新后的通用配置
 */
export async function updateGeneralSettings(
  settingsId: SettingsId,
  data: UpdateGeneralSettingsRequest
): Promise<GeneralSettings> {
  return await put<GeneralSettings>(
    `/general-settings/${settingsId}`,
    data
  );
}

/**
 * 根据类别和名称获取通用配置
 */
export async function getGeneralSettingsByName(
  category: string,
  name: string
): Promise<GeneralSettings> {
  return await get<GeneralSettings>(
    `/general-settings/by-name/${category}/${name}`
  );
}

