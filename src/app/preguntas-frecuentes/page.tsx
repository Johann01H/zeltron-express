import type { Metadata } from 'next'
import { WhatsApp } from '@/components/storefront'

export const metadata: Metadata = { title: 'Preguntas frecuentes | ZELTRON Express' }

const faqs=[['¿Cuánto tarda el envío?','La entrega estimada es de 3 a 7 días hábiles, dependiendo de tu ciudad y la transportadora disponible.'],['¿Puedo pagar contra entrega?','Sí. El pago contra entrega está disponible en nuestras zonas de cobertura. Pagas al recibir tu pedido.'],['¿Los productos tienen garantía?','Todos nuestros productos cuentan con garantía por defectos de fabricación. Conserva tu comprobante de compra.'],['¿Puedo retractarme de mi compra?','De acuerdo con la Ley 1480 de 2011, puedes ejercer el derecho de retracto dentro de los cinco días hábiles siguientes a la entrega, bajo las condiciones aplicables.']]
export default function FAQ(){return <><main className="mx-auto max-w-3xl px-4 py-16 lg:px-8"><h1 className="text-5xl">Preguntas frecuentes</h1><div className="mt-10 flex flex-col gap-3">{faqs.map(([q,a])=><div key={q} className="rounded-2xl border border-[#DDE2EE] bg-white p-5"><h2 className="text-lg">{q}</h2><p className="mt-3 text-sm leading-relaxed text-[#5B6478]">{a}</p></div>)}</div></main><WhatsApp/></>}
