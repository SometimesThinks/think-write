import {
  AUTOCOMPLETE_PREFIX_MAX_LENGTH,
  AUTOCOMPLETE_SUFFIX_MAX_LENGTH,
  type AutocompleteRequest,
} from '@/src/shared/autocomplete';

const INVALID_REQUEST_MESSAGE = 'Completion request body is invalid.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// completion 요청 검증 함수
export function validateAutocompleteRequest(input: unknown):
  | { ok: true; data: AutocompleteRequest }
  | { ok: false; message: string } {
  if (!isRecord(input)) {
    return { ok: false, message: INVALID_REQUEST_MESSAGE };
  }

  const { prefix, suffix, languageSettings } = input;

  if (typeof prefix !== 'string' || typeof suffix !== 'string') {
    return { ok: false, message: 'prefix and suffix must be strings.' };
  }

  if (prefix.length > AUTOCOMPLETE_PREFIX_MAX_LENGTH) {
    return {
      ok: false,
      message: `prefix must be at most ${AUTOCOMPLETE_PREFIX_MAX_LENGTH} characters.`,
    };
  }

  if (suffix.length > AUTOCOMPLETE_SUFFIX_MAX_LENGTH) {
    return {
      ok: false,
      message: `suffix must be at most ${AUTOCOMPLETE_SUFFIX_MAX_LENGTH} characters.`,
    };
  }

  if (!isRecord(languageSettings)) {
    return { ok: false, message: 'languageSettings must be an object.' };
  }

  const nativeLanguage = languageSettings.nativeLanguage;
  const targetLanguage = languageSettings.targetLanguage;

  if (!isNonEmptyString(nativeLanguage) || !isNonEmptyString(targetLanguage)) {
    return {
      ok: false,
      message: 'languageSettings.nativeLanguage and languageSettings.targetLanguage are required.',
    };
  }

  return {
    ok: true,
    data: {
      prefix,
      suffix,
      languageSettings: {
        nativeLanguage: nativeLanguage.trim(),
        targetLanguage: targetLanguage.trim(),
      },
    },
  };
}
