<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Convierte los productos de WooCommerce al formato público que espera el frontend.
 * Contrato: lib/types.ts (Product, Category) del proyecto Next.js.
 */
final class Catalog {

	private const CACHE_KEY = 'zeltron_catalog_v1';

	/** @return array<int, array<string, mixed>> */
	public static function products(): array {
		$cached = get_transient( self::CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$products = wc_get_products(
			array(
				'status'     => 'publish',
				'visibility' => 'catalog',
				'limit'      => -1,
				'orderby'    => array(
					'menu_order' => 'ASC',
					'date'       => 'DESC',
				),
			)
		);

		$data = array();
		foreach ( $products as $product ) {
			if ( $product instanceof \WC_Product && in_array( $product->get_type(), array( 'simple', 'variable' ), true ) ) {
				$item = self::to_array( $product );
				if ( $item['price'] > 0 ) {
					$data[] = $item;
				}
			}
		}

		set_transient( self::CACHE_KEY, $data, HOUR_IN_SECONDS );
		return $data;
	}

	public static function flush(): void {
		delete_transient( self::CACHE_KEY );
	}

	/** @return array<string, mixed> */
	public static function to_array( \WC_Product $product ): array {
		list( $category, $subcategory ) = self::categories_for( $product );

		if ( $product instanceof \WC_Product_Variable ) {
			$price   = (float) $product->get_variation_price( 'min', true );
			$regular = (float) $product->get_variation_regular_price( 'min', true );
		} else {
			$price   = (float) $product->get_price();
			$regular = (float) $product->get_regular_price();
		}

		return array(
			'id'             => (string) $product->get_id(),
			'slug'           => $product->get_slug(),
			'name'           => html_entity_decode( $product->get_name(), ENT_QUOTES, 'UTF-8' ),
			'category'       => $category,
			'subcategory'    => $subcategory,
			'brand'          => self::brand( $product ),
			'description'    => self::description( $product ),
			'price'          => (int) round( $price ),
			'compareAtPrice' => $regular > $price ? (int) round( $regular ) : null,
			'images'         => self::images( $product ),
			'variants'       => self::variants( $product ),
			'specs'          => self::specs( $product ),
			'stock'          => self::stock( $product ),
			'isBestSeller'   => 'yes' === $product->get_meta( Product_Fields::BEST_SELLER ),
			'freeShipping'   => 'yes' === $product->get_meta( Product_Fields::FREE_SHIPPING ),
		);
	}

	/**
	 * Categorías jerárquicas: la categoría padre es la "categoría" y la hija la "subcategoría".
	 *
	 * @return array{0: string, 1: string}
	 */
	private static function categories_for( \WC_Product $product ): array {
		$default = (int) get_option( 'default_product_cat' );
		$terms   = get_the_terms( $product->get_id(), 'product_cat' );
		if ( ! is_array( $terms ) ) {
			return array( 'Otros', 'General' );
		}
		$terms = array_values( array_filter( $terms, static fn( $t ) => (int) $t->term_id !== $default ) );
		if ( ! $terms ) {
			return array( 'Otros', 'General' );
		}
		// Preferimos una subcategoría (término con padre).
		usort( $terms, static fn( $a, $b ) => (int) ( $b->parent > 0 ) <=> (int) ( $a->parent > 0 ) );
		$term = $terms[0];
		if ( $term->parent > 0 ) {
			$parent = get_term( $term->parent, 'product_cat' );
			if ( $parent instanceof \WP_Term ) {
				return array( self::decode( $parent->name ), self::decode( $term->name ) );
			}
		}
		return array( self::decode( $term->name ), 'General' );
	}

	/** Árbol de categorías con al menos un producto publicado. */
	public static function categories(): array {
		$used = array();
		foreach ( self::products() as $p ) {
			$used[ $p['category'] ][ $p['subcategory'] ] = true;
		}

		$default = (int) get_option( 'default_product_cat' );
		$parents = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'parent'     => 0,
				'hide_empty' => false,
				'menu_order' => 'ASC',
			)
		);
		$out = array();
		foreach ( is_array( $parents ) ? $parents : array() as $parent ) {
			$name = self::decode( $parent->name );
			if ( (int) $parent->term_id === $default || ! isset( $used[ $name ] ) ) {
				continue;
			}
			$children = get_terms(
				array(
					'taxonomy'   => 'product_cat',
					'parent'     => $parent->term_id,
					'hide_empty' => false,
					'menu_order' => 'ASC',
				)
			);
			$subs = array();
			foreach ( is_array( $children ) ? $children : array() as $child ) {
				$child_name = self::decode( $child->name );
				if ( isset( $used[ $name ][ $child_name ] ) ) {
					$subs[] = $child_name;
				}
			}
			$out[] = array(
				'name'          => $name,
				'subcategories' => $subs,
			);
		}
		// Productos sin categoría asignada.
		if ( isset( $used['Otros'] ) ) {
			$out[] = array(
				'name'          => 'Otros',
				'subcategories' => array( 'General' ),
			);
		}
		return $out;
	}

	private static function brand( \WC_Product $product ): ?string {
		foreach ( array( 'product_brand', 'pa_marca' ) as $taxonomy ) {
			if ( taxonomy_exists( $taxonomy ) ) {
				$terms = get_the_terms( $product->get_id(), $taxonomy );
				if ( is_array( $terms ) && $terms ) {
					return self::decode( $terms[0]->name );
				}
			}
		}
		return null;
	}

	private static function description( \WC_Product $product ): string {
		$text = $product->get_short_description() ?: $product->get_description();
		$text = wp_strip_all_tags( strip_shortcodes( (string) $text ) );
		return trim( preg_replace( '/\s+/', ' ', html_entity_decode( $text, ENT_QUOTES, 'UTF-8' ) ) );
	}

	/** @return string[] */
	private static function images( \WC_Product $product ): array {
		$ids    = array_filter( array_merge( array( $product->get_image_id() ), $product->get_gallery_image_ids() ) );
		$images = array();
		foreach ( array_unique( $ids ) as $id ) {
			$url = wp_get_attachment_image_url( (int) $id, 'large' );
			if ( $url ) {
				$images[] = $url;
			}
		}
		return $images;
	}

	/** @return string[] */
	private static function variants( \WC_Product $product ): array {
		if ( ! $product instanceof \WC_Product_Variable ) {
			return array( 'Única' );
		}
		$names = array();
		foreach ( $product->get_children() as $child_id ) {
			$variation = wc_get_product( $child_id );
			if ( $variation instanceof \WC_Product_Variation && $variation->is_purchasable() && $variation->is_in_stock() ) {
				$names[] = self::variation_name( $variation );
			}
		}
		return $names ? array_values( array_unique( $names ) ) : array( 'Única' );
	}

	/** Nombre legible de una variación: "Negro / 128 GB". */
	public static function variation_name( \WC_Product_Variation $variation ): string {
		$parts = array();
		foreach ( $variation->get_variation_attributes() as $key => $value ) {
			$taxonomy = str_replace( 'attribute_', '', $key );
			if ( taxonomy_exists( $taxonomy ) ) {
				$term  = get_term_by( 'slug', $value, $taxonomy );
				$value = $term ? $term->name : $value;
			}
			if ( '' !== $value ) {
				$parts[] = self::decode( $value );
			}
		}
		return $parts ? implode( ' / ', $parts ) : 'Única';
	}

	/** @return array<int, array{label: string, value: string}> */
	private static function specs( \WC_Product $product ): array {
		$specs = array();
		foreach ( $product->get_attributes() as $attribute ) {
			// La marca ya viaja en su propio campo; no se repite como característica.
			if ( ! $attribute instanceof \WC_Product_Attribute || $attribute->get_variation() || ! $attribute->get_visible() || 'pa_marca' === $attribute->get_name() ) {
				continue;
			}
			$label  = wc_attribute_label( $attribute->get_name(), $product );
			$values = $attribute->is_taxonomy()
				? wp_list_pluck( $attribute->get_terms() ?: array(), 'name' )
				: $attribute->get_options();
			if ( $values ) {
				$specs[] = array(
					'label' => self::decode( $label ),
					'value' => self::decode( implode( ', ', $values ) ),
				);
			}
		}
		return $specs;
	}

	private static function stock( \WC_Product $product ): int {
		if ( ! $product->is_in_stock() ) {
			return 0;
		}
		if ( $product->managing_stock() ) {
			return max( 0, (int) $product->get_stock_quantity() );
		}
		if ( $product instanceof \WC_Product_Variable ) {
			$total = 0;
			foreach ( $product->get_children() as $child_id ) {
				$v = wc_get_product( $child_id );
				if ( $v && $v->is_in_stock() ) {
					$total += $v->managing_stock() ? max( 0, (int) $v->get_stock_quantity() ) : 99;
				}
			}
			return min( 99, $total );
		}
		// Sin control de inventario: disponible.
		return 99;
	}

	private static function decode( string $text ): string {
		return html_entity_decode( $text, ENT_QUOTES, 'UTF-8' );
	}
}
