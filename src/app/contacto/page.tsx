'use client'
import { useState } from 'react'
import { WhatsApp } from '@/components/storefront'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_DISPLAY, whatsappLink } from '@/lib/config'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    window.open(whatsappLink(`Hola, soy ${name}. Mi celular es ${phone}. ${message}`), '_blank')
  }
  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <h1 className="text-5xl">Contacto</h1>
        <p className="mt-3 max-w-xl text-[#5B6478]">Escríbenos por WhatsApp o redes sociales. Respondemos de lunes a sábado.</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#DDE2EE] bg-white p-6">
            <h2 className="text-xl">Canales directos</h2>
            <div className="mt-5 flex flex-col gap-4 text-sm text-[#5B6478]">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">WhatsApp: {WHATSAPP_DISPLAY}</a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram: @zeltronsas</a>
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">Facebook: zeltronsasoficial</a>
            </div>
          </div>
          <form onSubmit={submit} className="rounded-2xl border border-[#DDE2EE] bg-white p-6">
            <h2 className="text-xl">Escríbenos</h2>
            <div className="mt-5 flex flex-col gap-4">
              <label className="text-sm text-[#5B6478]">Nombre<Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 h-11" /></label>
              <label className="text-sm text-[#5B6478]">Celular<Input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="mt-2 h-11" /></label>
              <label className="text-sm text-[#5B6478]">Mensaje<Textarea required value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2 min-h-28" /></label>
              <button className="btn-primary h-12">Abrir WhatsApp</button>
            </div>
          </form>
        </div>
      </main>
      <WhatsApp />
    </>
  )
}
