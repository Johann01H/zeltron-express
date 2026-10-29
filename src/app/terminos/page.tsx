import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
export const metadata:Metadata={title:'Términos y condiciones | ZELTRON Express',description:'Términos de compra de ZELTRON Express.'}
export default function Page(){return <LegalPage eyebrow="Legal" title="Términos y condiciones" sections={[["Condiciones de compra","Al realizar un pedido aceptas estas condiciones y proporcionas datos correctos para la entrega. Los precios están expresados en pesos colombianos e incluyen IVA."],["Disponibilidad y pagos","La disponibilidad está sujeta al inventario del proveedor. Si un producto no está disponible, te contactaremos para ofrecer una alternativa o gestionar la devolución correspondiente. La empresa responsable es ZELTRON S.A.S."]]}/>}
