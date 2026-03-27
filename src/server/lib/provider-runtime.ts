export const DEFAULT_PROVIDER_MODEL = 'gpt-5-nano';

export type ProviderRuntimeConfig = {
  apiKey: string | null;
  model: string;
};

// 환경변수 정리 함수
function readRuntimeValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

// provider runtime 로드 함수
export function getProviderRuntimeConfig(): ProviderRuntimeConfig {
  return {
    apiKey: readRuntimeValue(process.env.OPENAI_API_KEY),
    model: readRuntimeValue(process.env.OPENAI_MODEL) ?? DEFAULT_PROVIDER_MODEL,
  };
}
