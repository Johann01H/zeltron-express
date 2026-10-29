import Link from "next/link";
import { ArrowRight, MessageCircle, Zap } from "lucide-react";
import { getCategories, getProducts } from "@/lib/catalog";
import { whatsappLink } from "@/lib/config";
import { formatCOP, isOnSale } from "@/lib/format";
import { ProductCard, WhatsApp } from "@/components/storefront";
import { CategoryGrid, HowItWorks, TrustBar } from "@/components/site-sections";
import { OfferSection, OfferCountdown } from "@/components/offer-countdown";

export const metadata = {
  title: "Inicio | ZELTRON Express",
  description: "Tecnología útil, precios honestos y pago contra entrega.",
};

export default async function Page() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const available = products.filter((p) => p.stock > 0);
  const best = (available.some((p) => p.isBestSeller) ? available.filter((p) => p.isBestSeller) : available).slice(0, 4);
  const featured = best[0] ?? products[0];
  const onSale = available.filter(isOnSale).length;

  return (
    <>
      <main>
        <section className="hero">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-28 pt-12 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-36 lg:pt-20">
            <div>
              <p className="hero-pill">
                <span aria-hidden="true" className="hero-pill-dot" />
                Pagas cuando recibes tu pedido
              </p>
              <h1 className="hero-title">Tecnología que llega a tu puerta.</h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
                Audífonos, cargadores, relojes y accesorios con precios claros. Pides hoy, lo recibes en 3 a 7 días hábiles y pagas en efectivo al recibir.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/productos?oferta=true" className="btn-volt">
                  <Zap aria-hidden="true" className="size-4" /> Ver ofertas
                </Link>
                <Link href="/productos" className="btn-ghost-light">Explorar catálogo</Link>
              </div>
            </div>

            {featured && (
              <Link href={`/producto/${featured.slug}`} className="ship-label group" aria-label={`Ver ${featured.name}`}>
                <div className="ship-label-head">
                  <span className="font-extrabold tracking-[-.04em]">ZELTRON <span className="text-[#0E1A3A]/60">Express</span></span>
                  <span className="ship-label-tag">Contra entrega</span>
                </div>
                <div className="ship-label-body">
                  <div className="ship-label-media">
                    <img src={featured.images[0]} alt="" className="size-full object-contain transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#5B6478]">Destacado de la semana</p>
                    <h2 className="mt-1 text-xl leading-tight text-[#0E1A3A] sm:text-2xl">{featured.name}</h2>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums text-[#0E1A3A]">{formatCOP(featured.price)}</p>
                    {isOnSale(featured) && <del className="text-sm text-[#5B6478]">{formatCOP(featured.compareAtPrice!)}</del>}
                  </div>
                </div>
                <dl className="ship-label-route">
                  <div><dt>Pides</dt><dd>Hoy</dd></div>
                  <div><dt>Llega en</dt><dd>3 a 7 días</dd></div>
                  <div><dt>Pagas</dt><dd>Al recibir</dd></div>
                </dl>
                <div className="ship-label-foot">
                  <span aria-hidden="true" className="ship-barcode" />
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-[#2F5BFF]">
                    Ver producto <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </section>

        <div className="home-canvas">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <TrustBar />
            <CategoryGrid categories={categories} products={products} />

            {onSale > 0 && (
              <OfferSection>
                <section className="offer-band" aria-labelledby="offer-title">
                  <div className="flex items-center gap-4">
                    <span className="offer-band-icon" aria-hidden="true"><Zap className="size-6" /></span>
                    <div>
                      <h2 id="offer-title" className="text-2xl text-[#0E1A3A] sm:text-3xl">Ofertas de la semana</h2>
                      <p className="mt-1 text-sm font-semibold text-[#0E1A3A]/70">{onSale} productos con descuento. Terminan en:</p>
                    </div>
                  </div>
                  <OfferCountdown segmented />
                  <Link href="/productos?oferta=true" className="offer-band-cta">
                    Ver ofertas <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </section>
              </OfferSection>
            )}

            <HowItWorks />

            <section className="py-16" aria-labelledby="best-title">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h2 id="best-title">Más vendidos</h2>
                  <p className="mt-2 text-sm text-[#5B6478]">Lo que más están pidiendo nuestros clientes.</p>
                </div>
                <Link href="/productos" className="link-arrow">Ver todo <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </div>
              <div className="product-grid">
                {best.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>

            <section className="help-band" aria-labelledby="help-title">
              <div>
                <h2 id="help-title" className="text-2xl text-white sm:text-3xl">¿Dudas antes de comprar?</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  Te respondemos por WhatsApp sobre compatibilidad, tiempos de entrega o el estado de tu pedido. Atención por personas, no por bots.
                </p>
              </div>
              <a href={whatsappLink("Hola, tengo una pregunta antes de comprar.")} target="_blank" rel="noreferrer" className="help-band-cta">
                <MessageCircle aria-hidden="true" className="size-5" /> Escribir por WhatsApp
              </a>
            </section>
          </div>
        </div>
      </main>
      <WhatsApp />
    </>
  );
}
