import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
export const metadata:Metadata={title:'Envíos | ZELTRON Express',description:'Información de envíos de ZELTRON Express.'}
export default function Page(){return <LegalPage eyebrow="Servicio" title="Envíos" sections={[["Cobertura y tiempos","Realizamos envíos a todo el territorio nacional. La entrega estimada es de 3 a 7 días hábiles, según la ciudad y la transportadora disponible."],["Costo y pago","El envío es gratis en compras desde $150.000. Para pedidos inferiores, el costo es de $12.000. También puedes pagar contra entrega."],["Seguimiento","Te enviaremos la información de seguimiento por WhatsApp al número registrado en tu pedido. Si necesitas ayuda, escríbenos al +57 302 593 1994."]]}/>} 
