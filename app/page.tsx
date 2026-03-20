export default function Home() {
  const featureChecklist = [
    '학습 언어 설정',
    'Ghost Complete 프로토타입',
    'BYOK 기반 provider 연동',
  ];

  const editorHints = [
    '입력을 멈추면 문맥 기반 제안 생성',
    'Tab으로 제안 수락',
    'Esc 또는 추가 입력 시 제안 무효화',
  ];

  return (
    <main className='flex min-h-screen flex-col bg-zinc-950 text-zinc-50'>
      <section className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 lg:px-10'>
        <header className='flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-3'>
              <span className='inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200 uppercase'>
                ThinkWrite MVP
              </span>
              <div className='space-y-2'>
                <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
                  글쓰기 흐름을 끊지 않는 AI writing editor
                </h1>
                <p className='max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base'>
                  채팅 화면이 아니라 편집기 안에서 바로 표현 제안을 받는 외국어 글쓰기 경험을 만드는
                  중이다. 현재 범위는 학습 언어 설정, Ghost Complete, BYOK provider 연동까지다.
                </p>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-3 lg:min-w-[360px]'>
              {featureChecklist.map((item) => (
                <div
                  key={item}
                  className='rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200'
                >
                  <div className='mb-2 text-xs tracking-wide text-zinc-500 uppercase'>MVP</div>
                  <div className='font-medium'>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className='grid flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
          <aside className='space-y-4'>
            <section className='rounded-3xl border border-white/10 bg-white p-5 text-zinc-950 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-semibold tracking-wide uppercase'>Language setup</h2>
                <span className='rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600'>
                  Draft
                </span>
              </div>

              <div className='space-y-3'>
                <div className='rounded-2xl border border-zinc-200 p-3'>
                  <div className='text-xs text-zinc-500'>모국어</div>
                  <div className='mt-1 font-medium'>한국어</div>
                </div>
                <div className='rounded-2xl border border-zinc-200 p-3'>
                  <div className='text-xs text-zinc-500'>목표 언어</div>
                  <div className='mt-1 font-medium'>영어</div>
                </div>
              </div>
            </section>

            <section className='rounded-3xl border border-white/10 bg-white p-5 text-zinc-950 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-semibold tracking-wide uppercase'>BYOK</h2>
                <span className='rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700'>
                  Provider TBD
                </span>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='rounded-2xl border border-dashed border-zinc-300 p-3'>
                  <div className='text-xs text-zinc-500'>선택된 provider</div>
                  <div className='mt-1 font-medium text-zinc-700'>아직 미확정</div>
                </div>
                <div className='rounded-2xl border border-dashed border-zinc-300 p-3'>
                  <div className='text-xs text-zinc-500'>API Key 상태</div>
                  <div className='mt-1 font-medium text-zinc-700'>브라우저 로컬 저장 예정</div>
                </div>
              </div>
            </section>

            <section className='rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200'>
              <h2 className='mb-3 font-semibold tracking-wide uppercase'>Ghost interaction</h2>
              <ul className='space-y-2 text-zinc-300'>
                {editorHints.map((item) => (
                  <li key={item} className='flex gap-2'>
                    <span className='mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <section className='flex min-h-[640px] flex-col rounded-[32px] border border-white/10 bg-white text-zinc-950 shadow-2xl shadow-black/20'>
            <div className='flex items-center justify-between border-b border-zinc-200 px-6 py-4'>
              <div>
                <div className='text-sm font-semibold'>Editor shell</div>
                <div className='text-xs text-zinc-500'>
                  Tiptap 기반 편집기와 ghost suggestion 영역이 들어올 자리
                </div>
              </div>
              <div className='flex items-center gap-2 text-xs text-zinc-500'>
                <span className='rounded-full bg-zinc-100 px-3 py-1'>idle</span>
                <span className='rounded-full bg-zinc-100 px-3 py-1'>tab accept</span>
                <span className='rounded-full bg-zinc-100 px-3 py-1'>esc dismiss</span>
              </div>
            </div>

            <div className='flex flex-1 flex-col gap-6 p-6'>
              <div className='rounded-3xl border border-zinc-200 bg-zinc-50 p-5'>
                <p className='text-lg leading-8 text-zinc-900'>
                  I want to explain my idea more clearly, but I often stop because I cannot find the
                  next sentence in English.
                  <span className='ml-1 text-zinc-400'>
                    Maybe I need a tool that helps me continue the draft without breaking my flow.
                  </span>
                </p>
              </div>

              <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]'>
                <div className='rounded-3xl border border-dashed border-zinc-300 p-5'>
                  <div className='mb-3 text-sm font-semibold'>Next implementation targets</div>
                  <ol className='space-y-3 text-sm leading-6 text-zinc-600'>
                    <li>1. Tiptap editor mount</li>
                    <li>2. Ghost text decoration render</li>
                    <li>3. Debounced completion request</li>
                    <li>4. BYOK setting persistence</li>
                  </ol>
                </div>

                <div className='rounded-3xl bg-zinc-950 p-5 text-sm text-zinc-200'>
                  <div className='mb-3 font-semibold text-white'>Request preview</div>
                  <div className='space-y-2 text-zinc-400'>
                    <div>nativeLanguage: ko</div>
                    <div>targetLanguage: en</div>
                    <div>provider: pending</div>
                    <div>contextWindow: current paragraph</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
