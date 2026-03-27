import type { AutocompleteResponse } from '@/src/shared/autocomplete';

export type ApiErrorCode =
  | 'INVALID_PARAMETERS'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_AUTH_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'PROVIDER_API_ERROR';

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    status: number;
    requestId: string;
  };
};

export type RouteResult<TBody> = {
  status: number;
  body: TBody;
};

// 요청 추적용 id 생성 함수
export function createRequestId() {
  return `req_${crypto.randomUUID()}`;
}

// 성공 응답 공통 포맷 생성 함수
export function createSuccessResult(
  body: Omit<AutocompleteResponse, 'requestId'>,
  requestId: string,
): RouteResult<AutocompleteResponse> {
  return {
    status: 200,
    body: {
      ...body,
      requestId,
    },
  };
}

// 실패 응답 공통 포맷 생성 함수
export function createErrorResult(
  code: ApiErrorCode,
  message: string,
  status: number,
  requestId: string,
): RouteResult<ApiErrorResponse> {
  return {
    status,
    body: {
      error: {
        code,
        message,
        status,
        requestId,
      },
    },
  };
}
