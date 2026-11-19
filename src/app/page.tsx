import Link from "next/link";
import { ArrowRight, MessageCircle, Zap } from "lucide-react";
import { getCategories, getProducts } from "@/lib/catalog";
import { whatsappLink } from "@/lib/config";
import { isOnSale } from "@/lib/format";
import { ProductCard } from "@/components/storefront";
import { CategoryGrid, HowItWorks, TrustBar } from "@/components/site-sections";
import { OfferSection, OfferCountdown } from "@/components/offer-countdown";
import { ShortsShelf } from "@/components/shorts";
import { getShorts } from "@/lib/shorts";
import { getBannerSections } from "@/lib/banners";
import { PromoBannerSection } from "@/components/promo-banners";
import { HeroSlider } from "@/components/hero-slider";
import { getHeroSlides } from "@/lib/hero";

export const metadata = {
  title: "Inicio | ZELTRON Express",
  description: "Tecnología útil, precios honestos y pago contra entrega.",
};

export default async function Page() {
  const [products, categories, shorts, promos] = await Promise.all([getProducts(), getCategories(), getShorts(), getBannerSections()]);
  const available = products.filter((p) => p.stock > 0);
  const best = (available.some((p) => p.isBestSeller) ? available.filter((p) => p.isBestSeller) : available).slice(0, 4);
  const featured = best[0] ?? products[0];
  const onSale = available.filter(isOnSale).length;
  const heroSlides = await getHeroSlides(products, featured);

  return (
    <>
      <main>
        <section className="hero">
          <HeroSlider slides={heroSlides} />
        </section>

        <div className="home-canvas">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <TrustBar />
            {promos.map((section, i) => <PromoBannerSection key={section.id} section={section} index={i} />)}
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

            {shorts.length > 0 && (
              <section className="py-16" aria-labelledby="shorts-title">
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <h2 id="shorts-title">Míralo en acción</h2>
                    <p className="mt-2 text-sm text-[#5B6478]">Videos cortos de los productos funcionando de verdad.</p>
                  </div>
                  <Link href="/shorts" className="link-arrow">Ver todos <ArrowRight aria-hidden="true" className="size-4" /></Link>
                </div>
                <ShortsShelf shorts={shorts.slice(0, 12)} />
              </section>
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
    </>
  );
}
