'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, PackageCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { WhatsApp } from '@/components/storefront'
import { FREE_SHIPPING_FROM, shippingFor } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import { useHydrated } from '@/lib/use-hydrated'
import { cartSubtotal, useCart } from '@/store/cart'
import { useOrders } from '@/store/orders'
import { placeOrder } from './actions'
import { DeliveryFields, readDeliveryForm } from '@/components/delivery-fields'

const checkoutSteps = ['Carrito', 'Entrega', 'Confirmación']

export default function CheckoutPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const items = useCart((state) => state.items)
  const clearCart = useCart((state) => state.clear)
  const addOrder = useOrders((state) => state.addOrder)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const subtotal = cartSubtotal(items)
  const shipping = shippingFor(subtotal)
  const total = subtotal + shipping

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await placeOrder({
        customer: readDeliveryForm(formData),
        items: items.map((item) => ({ productId: item.id, variant: item.selectedVariant, quantity: item.quantity })),
      })

      if (!result.ok) {
        setError(result.error)
        return
      }
      addOrder(result.order)
      clearCart()
      router.push(`/pedido/${result.order.reference}`)
    })
  }

  return (
    <>
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-topline">
            <Link href="/carrito" className="checkout-back-link">
              <ArrowLeft aria-hidden="true" />
              Volver al carrito
            </Link>
            <span className="checkout-secure-note">
              <LockKeyhole aria-hidden="true" />
              Tus datos solo se usan para coordinar la entrega
            </span>
          </div>

          <nav className="checkout-progress" aria-label="Progreso de compra">
            <ol>
              {checkoutSteps.map((step, index) => (
                <li
                  key={step}
                  data-state={index < 1 ? 'complete' : index === 1 ? 'current' : 'upcoming'}
                  aria-current={index === 1 ? 'step' : undefined}
                >
                  <span className="checkout-step-index">
                    {index === 0 ? <Check aria-hidden="true" /> : `0${index + 1}`}
                  </span>
                  <span className="checkout-step-label">{step}</span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="checkout-heading">
            <div>
              <h1>Finaliza tu pedido</h1>
              <p className="checkout-intro">Completa tus datos y revisa el resumen antes de confirmar.</p>
            </div>
          </div>

          {!hydrated ? (
            <div className="checkout-empty h-64 animate-pulse" aria-busy="true" />
          ) : items.length === 0 ? (
            <section className="checkout-empty" aria-labelledby="checkout-empty-title">
              <span className="checkout-empty-icon" aria-hidden="true"><PackageCheck /></span>
              <p className="checkout-eyebrow">Tu compra empieza aquí</p>
              <h2 id="checkout-empty-title">Tu carrito está vacío</h2>
              <p>Explora el catálogo y agrega tus favoritos para continuar.</p>
              <Link href="/productos" className="checkout-empty-link">
                Ir al catálogo <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          ) : (
            <div className="checkout-layout">
              <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
                <div className="checkout-summary-header">
                  <div>
                    <p className="checkout-summary-kicker">ZELTRON EXPRESS</p>
                    <h2 id="checkout-summary-title">Tu pedido</h2>
                  </div>
                  <span className="checkout-summary-count">
                    {items.length} {items.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                <div className="checkout-summary-items">
                  {items.map((item) => (
                    <article className="checkout-summary-item" key={`${item.id}-${item.selectedVariant}`}>
                      <div className="checkout-item-thumb">
                        <img src={item.images[0]} alt={item.name} />
                      </div>
                      <div className="checkout-item-copy">
                        <h3>{item.name}</h3>
                        <p>{item.selectedVariant} · Cantidad: {item.quantity}</p>
                      </div>
                      <strong>{formatCOP(item.price * item.quantity)}</strong>
                    </article>
                  ))}
                </div>

                <div className="checkout-summary-totals">
                  <div><span>Subtotal</span><strong>{formatCOP(subtotal)}</strong></div>
                  <div><span>Envío</span><strong>{shipping === 0 ? 'Gratis' : formatCOP(shipping)}</strong></div>
                  <div className="checkout-total-row"><span>Total</span><strong>{formatCOP(total)}</strong></div>
                </div>

                {subtotal > 0 && subtotal < FREE_SHIPPING_FROM ? (
                  <p className="checkout-shipping-note">Te faltan {formatCOP(FREE_SHIPPING_FROM - subtotal)} para obtener envío gratis.</p>
                ) : subtotal >= FREE_SHIPPING_FROM ? (
                  <p className="checkout-shipping-note">Tu pedido ya tiene envío gratis.</p>
                ) : null}

                <div className="checkout-summary-protection">
                  <ShieldCheck aria-hidden="true" />
                  <span>Pago contra entrega y compra protegida.</span>
                </div>
              </aside>

              <form className="checkout-form" onSubmit={submit}>
                <section className="checkout-form-section" aria-labelledby="checkout-delivery-title">
                  <div className="checkout-section-heading">
                    <span className="checkout-section-number">01</span>
                    <div>
                      <h2 id="checkout-delivery-title">Datos de entrega</h2>
                      <p>¿A dónde enviamos tu pedido?</p>
                    </div>
                  </div>

                  <DeliveryFields />
                </section>

                <Separator className="checkout-separator" />

                <section className="checkout-form-section" aria-labelledby="checkout-payment-title">
                  <div className="checkout-section-heading">
                    <span className="checkout-section-number">02</span>
                    <div>
                      <h2 id="checkout-payment-title">Método de pago</h2>
                      <p>Sin pagos por adelantado.</p>
                    </div>
                  </div>
                  <div className="checkout-payment-card">
                    <span className="checkout-payment-icon" aria-hidden="true"><CreditCard /></span>
                    <div>
                      <strong>Pago contra entrega</strong>
                      <p>Pagas en efectivo cuando recibes. Antes de despachar te escribimos por WhatsApp para confirmar.</p>
                    </div>
                    <span className="checkout-payment-status">Seleccionado</span>
                  </div>
                </section>

                {error && <FieldError className="checkout-error">{error}</FieldError>}

                <Button type="submit" size="lg" className="checkout-submit" disabled={pending}>
                  {pending ? 'Enviando pedido…' : 'Confirmar pedido'}
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <p className="checkout-form-footnote">Revisa que tus datos de entrega estén correctos antes de continuar.</p>
              </form>
            </div>
          )}
        </div>
      </main>
      <WhatsApp />
    </>
  )
}
