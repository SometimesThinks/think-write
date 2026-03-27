import { createErrorResult } from '@/src/server/lib/route-result';

type ProviderErrorPayload = {
  error?: {
    message?: string;
  };
};

// provider 응답 메시지 읽기 함수
function readProviderErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { error } = payload as ProviderErrorPayload;

  return typeof error?.message === 'string' ? error.message : null;
}

// provider 미설정 오류 생성 함수
export function createProviderNotConfiguredResult(requestId: string) {
  return createErrorResult(
    'PROVIDER_NOT_CONFIGURED',
    'Provider runtime is not configured. Set OPENAI_API_KEY in server .env.local.',
    500,
    requestId,
  );
}

// provider 오류 매핑 함수
export function createProviderErrorResult(
  status: number,
  payload: unknown,
  requestId: string,
) {
  const message = readProviderErrorMessage(payload);

  if (status === 401) {
    return createErrorResult(
      'PROVIDER_AUTH_FAILED',
      message ?? 'Provider authentication failed.',
      401,
      requestId,
    );
  }

  if (status === 429) {
    return createErrorResult(
      'RATE_LIMIT_EXCEEDED',
      message ?? 'Provider rate limit was exceeded.',
      429,
      requestId,
    );
  }

  return createErrorResult(
    'PROVIDER_API_ERROR',
    message ?? 'Provider API request failed.',
    502,
    requestId,
  );
}

// provider 네트워크 오류 생성 함수
export function createProviderNetworkErrorResult(requestId: string) {
  return createErrorResult(
    'PROVIDER_API_ERROR',
    'Failed to reach provider API.',
    502,
    requestId,
  );
}

// provider 응답 포맷 오류 생성 함수
export function createProviderResponseFormatErrorResult(requestId: string) {
  return createErrorResult(
    'PROVIDER_API_ERROR',
    'Provider response did not include valid text output.',
    502,
    requestId,
  );
}
