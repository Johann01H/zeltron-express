<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Campos propios del producto (pestaña General de WooCommerce).
 * Proveedor y costo son PRIVADOS: nunca salen por la API pública.
 */
final class Product_Fields {

	public const SUPPLIER      = '_zx_supplier';
	public const SUPPLIER_URL  = '_zx_supplier_url';
	public const SUPPLIER_COST = '_zx_supplier_cost';
	public const BEST_SELLER   = '_zx_best_seller';
	public const FREE_SHIPPING = '_zx_free_shipping';

	public static function init(): void {
		add_action( 'woocommerce_product_options_general_product_data', array( self::class, 'render' ) );
		add_action( 'woocommerce_admin_process_product_object', array( self::class, 'save' ) );
		add_filter( 'manage_edit-product_columns', array( self::class, 'columns' ), 20 );
		add_action( 'manage_product_posts_custom_column', array( self::class, 'column_content' ), 10, 2 );
	}

	public static function render(): void {
		echo '<div class="options_group zeltron-fields"><p class="form-field"><strong style="font-size:13px">Zeltron · Proveedor y margen</strong></p>';

		woocommerce_wp_text_input(
			array(
				'id'          => self::SUPPLIER,
				'label'       => 'Proveedor',
				'placeholder' => 'Ej. Tech Global',
				'desc_tip'    => true,
				'description' => 'Solo visible en el panel.',
			)
		);
		woocommerce_wp_text_input(
			array(
				'id'          => self::SUPPLIER_URL,
				'label'       => 'Enlace del proveedor',
				'type'        => 'url',
				'placeholder' => 'https://',
			)
		);
		woocommerce_wp_text_input(
			array(
				'id'                => self::SUPPLIER_COST,
				'label'             => 'Costo del proveedor (COP)',
				'type'              => 'number',
				'custom_attributes' => array(
					'min'  => '0',
					'step' => '100',
				),
				'desc_tip'          => true,
				'description'       => 'Se usa para calcular el margen de cada producto y pedido.',
			)
		);

		global $product_object;
		if ( $product_object instanceof \WC_Product ) {
			$margin = self::margin( $product_object );
			if ( null !== $margin ) {
				printf(
					'<p class="form-field"><label>Margen actual</label><strong>%s</strong> (%s%%)</p>',
					wp_kses_post( wc_price( $margin['amount'] ) ),
					esc_html( $margin['percent'] )
				);
			}
		}

		woocommerce_wp_checkbox(
			array(
				'id'          => self::BEST_SELLER,
				'label'       => 'Más vendido',
				'description' => 'Mostrar en “Más vendidos” del inicio.',
			)
		);
		woocommerce_wp_checkbox(
			array(
				'id'          => self::FREE_SHIPPING,
				'label'       => 'Envío gratis',
				'description' => 'Muestra la etiqueta “Envío gratis” en la tienda.',
			)
		);
		echo '</div>';
	}

	public static function save( \WC_Product $product ): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- WooCommerce ya verificó el nonce del formulario de producto.
		$product->update_meta_data( self::SUPPLIER, sanitize_text_field( wp_unslash( $_POST[ self::SUPPLIER ] ?? '' ) ) );
		$product->update_meta_data( self::SUPPLIER_URL, esc_url_raw( wp_unslash( $_POST[ self::SUPPLIER_URL ] ?? '' ) ) );
		$cost = isset( $_POST[ self::SUPPLIER_COST ] ) && '' !== $_POST[ self::SUPPLIER_COST ] ? (string) absint( $_POST[ self::SUPPLIER_COST ] ) : '';
		$product->update_meta_data( self::SUPPLIER_COST, $cost );
		$product->update_meta_data( self::BEST_SELLER, isset( $_POST[ self::BEST_SELLER ] ) ? 'yes' : 'no' );
		$product->update_meta_data( self::FREE_SHIPPING, isset( $_POST[ self::FREE_SHIPPING ] ) ? 'yes' : 'no' );
		// phpcs:enable
	}

	public static function cost( \WC_Product $product ): ?float {
		$cost = $product->get_meta( self::SUPPLIER_COST );
		if ( '' === $cost && $product->get_parent_id() ) {
			$parent = wc_get_product( $product->get_parent_id() );
			$cost   = $parent ? $parent->get_meta( self::SUPPLIER_COST ) : '';
		}
		return '' === $cost ? null : (float) $cost;
	}

	/** @return array{amount: float, percent: string}|null */
	public static function margin( \WC_Product $product ): ?array {
		$cost  = self::cost( $product );
		$price = (float) $product->get_price();
		if ( null === $cost || $price <= 0 ) {
			return null;
		}
		$amount = $price - $cost;
		return array(
			'amount'  => $amount,
			'percent' => number_format_i18n( ( $amount / $price ) * 100, 0 ),
		);
	}

	public static function columns( array $columns ): array {
		$out = array();
		foreach ( $columns as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'price' === $key ) {
				$out['zx_margin'] = 'Margen';
			}
		}
		return $out;
	}

	public static function column_content( string $column, int $post_id ): void {
		if ( 'zx_margin' !== $column ) {
			return;
		}
		$product = wc_get_product( $post_id );
		$margin  = $product ? self::margin( $product ) : null;
		if ( null === $margin ) {
			echo '<span style="color:#999">Sin costo</span>';
			return;
		}
		$color = (float) $margin['percent'] < 20 ? '#b42318' : '#12805c';
		printf( '<span style="color:%s;font-weight:600">%s</span><br><small>%s%%</small>', esc_attr( $color ), wp_kses_post( wc_price( $margin['amount'] ) ), esc_html( $margin['percent'] ) );
	}
}
