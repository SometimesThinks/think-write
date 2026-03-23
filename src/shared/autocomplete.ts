export const AUTOCOMPLETE_PROVIDER = 'openai' as const;

export const AUTOCOMPLETE_PREFIX_MAX_LENGTH = 1200;
export const AUTOCOMPLETE_SUFFIX_MAX_LENGTH = 300;

export type AutocompleteProvider = typeof AUTOCOMPLETE_PROVIDER;

export type LanguageSettings = {
  nativeLanguage: string;
  targetLanguage: string;
};

export type AutocompleteRequest = {
  prefix: string;
  suffix: string;
  languageSettings: LanguageSettings;
  provider: AutocompleteProvider;
};

export type AutocompleteResponse = {
  output: string;
  requestId: string;
};
