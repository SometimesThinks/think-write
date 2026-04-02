'use client';

import type { LanguageSettings } from '@/src/shared/autocomplete';

export type SettingsScreen = 'list' | 'language';

type SettingsModalProps = {
  isOpen: boolean;
  languageSettings: LanguageSettings;
  settingsScreen: SettingsScreen;
  onClose: () => void;
  onOpenLanguage: () => void;
  onBack: () => void;
  onNativeLanguageChange: (value: string) => void;
  onTargetLanguageChange: (value: string) => void;
};

// 언어 선택 컴포넌트
function LanguageSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className='block rounded-2xl border border-zinc-200 p-3'>
      <div className='text-xs text-zinc-500'>{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-emerald-400'
      >
        <option value='ko'>한국어</option>
        <option value='en'>영어</option>
        <option value='ja'>일본어</option>
        <option value='zh'>중국어</option>
      </select>
    </label>
  );
}

export function SettingsModal({
  isOpen,
  languageSettings,
  settingsScreen,
  onClose,
  onOpenLanguage,
  onBack,
  onNativeLanguageChange,
  onTargetLanguageChange,
}: SettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-8'>
      <div className='w-full max-w-md rounded-[28px] border border-white/10 bg-zinc-950 p-6 text-zinc-50 shadow-2xl shadow-black/40'>
        <div className='mb-6 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            {settingsScreen === 'language' && (
              <button
                type='button'
                aria-label='설정 목록으로 돌아가기'
                className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10'
                onClick={onBack}
              >
                ←
              </button>
            )}
            <div className='text-lg font-semibold'>
              {settingsScreen === 'list' ? 'Settings' : 'Language settings'}
            </div>
          </div>
          <button
            type='button'
            aria-label='설정 닫기'
            className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10'
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {settingsScreen === 'list' ? (
          <div className='space-y-3'>
            <button
              type='button'
              className='flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10'
              onClick={onOpenLanguage}
            >
              <div>
                <div className='font-medium text-white'>언어 설정</div>
                <div className='mt-1 text-sm text-zinc-400'>
                  {languageSettings.nativeLanguage} → {languageSettings.targetLanguage}
                </div>
              </div>
              <span className='text-zinc-500'>→</span>
            </button>
          </div>
        ) : (
          <div className='space-y-3'>
            <LanguageSelect
              label='모국어'
              value={languageSettings.nativeLanguage}
              onChange={onNativeLanguageChange}
            />
            <LanguageSelect
              label='목표 언어'
              value={languageSettings.targetLanguage}
              onChange={onTargetLanguageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
