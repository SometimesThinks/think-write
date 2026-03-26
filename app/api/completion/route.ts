import { NextRequest, NextResponse } from 'next/server';

import { createErrorResult, createRequestId } from '@/src/server/lib/route-result';
import { complete } from '@/src/server/use-cases/completion';
import { validateAutocompleteRequest } from '@/src/shared/validate-autocomplete-request';

// 자동 완성 내부 API
export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const result = createErrorResult(
      'INVALID_PARAMETERS',
      'Request body must be valid JSON.',
      400,
      requestId,
    );

    return NextResponse.json(result.body, { status: result.status });
  }

  const validated = validateAutocompleteRequest(body);

  if (!validated.ok) {
    const result = createErrorResult('INVALID_PARAMETERS', validated.message, 400, requestId);

    return NextResponse.json(result.body, { status: result.status });
  }

  const result = await complete(validated.data, requestId);

  return NextResponse.json(result.body, { status: result.status });
}
