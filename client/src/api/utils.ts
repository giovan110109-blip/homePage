import type { ApiResponse, ApiError } from '@/types/api'

export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
  code: number
}

export async function withApi<T>(
  promise: Promise<ApiResponse<T>>
): Promise<ApiResult<T>> {
  try {
    const response = await promise
    return {
      success: response.success ?? true,
      data: response.data,
      code: response.code ?? 200,
    }
  } catch (error: any) {
    const apiError = error as ApiError
    return {
      success: false,
      error: apiError.message || error.message || '请求失败',
      code: apiError.code || 500,
    }
  }
}

export function createApiResult<T>(
  data: T,
  message = '操作成功',
  code = 200
): ApiResult<T> {
  return {
    success: true,
    data,
    code,
  }
}

export function createApiError(
  message: string,
  code = 500
): ApiResult<never> {
  return {
    success: false,
    error: message,
    code,
  }
}

export function isSuccess<T>(result: ApiResult<T>): result is ApiResult<T> & { data: T } {
  return result.success && result.data !== undefined
}

export function isError<T>(result: ApiResult<T>): result is ApiResult<T> & { error: string } {
  return !result.success && result.error !== undefined
}
