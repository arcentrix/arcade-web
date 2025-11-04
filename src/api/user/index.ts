import { get, post, put } from '../client'
import type { UserInfo } from '@/models/user'

// 获取当前用户信息
function fetchUserInfo() {
  return get<UserInfo>('/users/me', { silence: true })
}

// 更新用户信息
function updateUserInfo(userId: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; avatar?: string }) {
  return put<UserInfo>(`/users/${userId}`, data)
}

// 登出
function logout() {
  return post<{ msg: string }>('/users/logout', {})
}

// 刷新 token
function refreshToken() {
  return post<{ token: string }>('/users/refresh', {}, { silence: true })
}

// 邀请用户
function inviteUser(data: { email: string; role?: string }) {
  return post('/users/invite', data, { silence: true })
}

// 上传头像
function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post<{ url: string }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export default {
  getUserInfo: fetchUserInfo,
  updateUserInfo,
  logout,
  refreshToken,
  inviteUser,
  uploadAvatar,
}

