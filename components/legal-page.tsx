import { WhatsApp } from '@/components/storefront'

export function LegalPage({ eyebrow, title, sections }: { eyebrow: string; title: string; sections: [string, string][] }) {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-5xl">{title}</h1>
        <div className="mt-10 flex flex-col gap-6">
          {sections.map(([heading, body]) => (
            <section key={heading} className="rounded-2xl border border-[#DDE2EE] bg-white p-6">
              <h2 className="text-xl">{heading}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#5B6478]">{body}</p>
            </section>
          ))}
        </div>
      </main>
      <WhatsApp />
    </>
  )
}
