import {
  createProviderErrorResult,
  createProviderNetworkErrorResult,
  createProviderNotConfiguredResult,
  createProviderResponseFormatErrorResult,
} from '@/src/server/lib/provider-error';
import { getProviderRuntimeConfig } from '@/src/server/lib/provider-runtime';
import { createSuccessResult } from '@/src/server/lib/route-result';

import type { AutocompleteRequest } from '@/src/shared/autocomplete';

type ProviderResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

// provider 입력 생성 함수
function createProviderInput(request: AutocompleteRequest) {
  return [
    `Native language: ${request.languageSettings.nativeLanguage}`,
    `Target language: ${request.languageSettings.targetLanguage}`,
    'Task: continue the target-language text naturally.',
    'Return only the continuation text to insert at the cursor.',
    '',
    '<prefix>',
    request.prefix,
    '</prefix>',
    '',
    '<suffix>',
    request.suffix,
    '</suffix>',
  ].join('\n');
}

// provider 지시문 생성 함수
// todo: 프롬프트 사후 조정 예정
function createProviderInstructions() {
  return [
    'You are generating ghost text for a writing editor.',
    'Return only the continuation to append after the prefix and before the suffix.',
    'Do not explain the result.',
    'Do not repeat the prefix or suffix.',
    'Use the target language naturally and keep the continuation short.',
  ].join(' ');
}

// provider 출력 추출 함수
function readProviderOutput(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const response = payload as ProviderResponsePayload;

  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  for (const item of response.output ?? []) {
    if (item.type !== 'message') {
      continue;
    }

    for (const content of item.content ?? []) {
      if (
        content.type === 'output_text' &&
        typeof content.text === 'string' &&
        content.text.trim()
      ) {
        return content.text.trim();
      }
    }
  }

  return null;
}

// provider adapter 함수
export async function generateText(request: AutocompleteRequest, requestId: string) {
  const runtime = getProviderRuntimeConfig();

  if (!runtime.apiKey) {
    return createProviderNotConfiguredResult(requestId);
  }

  let response: Response;

  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      body: JSON.stringify({
        model: runtime.model,
        reasoning: {
          effort: 'minimal',
        },
        text: {
          verbosity: 'low',
        },
        instructions: createProviderInstructions(),
        input: createProviderInput(request),
        max_output_tokens: 128,
      }),
    });
  } catch {
    return createProviderNetworkErrorResult(requestId);
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    if (response.ok) {
      return createProviderResponseFormatErrorResult(requestId);
    }
  }

  if (!response.ok) {
    return createProviderErrorResult(response.status, payload, requestId);
  }

  const output = readProviderOutput(payload);

  if (!output) {
    return createProviderResponseFormatErrorResult(requestId);
  }

  return createSuccessResult({ output }, requestId);
}
