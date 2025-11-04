/**
 * 通用配置相关 API
 */

import { get, put } from '../client';
import type {
  GeneralSettings,
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
  return await get<GetGeneralSettingsListResponse>(
    '/general-settings',
    { params }
  );
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
 * 获取通用配置详情
 */
export async function getGeneralSettings(id: number): Promise<GeneralSettings> {
  return await get<GeneralSettings>(
    `/general-settings/${id}`
  );
}

/**
 * 更新通用配置
 */
export async function updateGeneralSettings(
  id: number,
  data: UpdateGeneralSettingsRequest
): Promise<GeneralSettings> {
  return await put<GeneralSettings>(
    `/general-settings/${id}`,
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

