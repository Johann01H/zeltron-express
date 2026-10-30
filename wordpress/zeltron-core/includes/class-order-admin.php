<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Panel de pedidos: número ZX visible, guía de envío, zona y margen por pedido.
 */
final class Order_Admin {

	public static function init(): void {
		// El cliente y el equipo hablan del mismo número: ZX-AAAAMMDD-XXXX.
		add_filter( 'woocommerce_order_number', array( self::class, 'order_number' ), 10, 2 );

		add_action( 'woocommerce_admin_order_data_after_shipping_address', array( self::class, 'shipping_box' ) );
		add_action( 'woocommerce_process_shop_order_meta', array( self::class, 'save_shipping_box' ), 50 );

		// Columnas (HPOS y almacenamiento clásico).
		add_filter( 'manage_woocommerce_page_wc-orders_columns', array( self::class, 'columns' ), 20 );
		add_action( 'manage_woocommerce_page_wc-orders_custom_column', array( self::class, 'column_content_hpos' ), 10, 2 );
		add_filter( 'manage_edit-shop_order_columns', array( self::class, 'columns' ), 20 );
		add_action( 'manage_shop_order_posts_custom_column', array( self::class, 'column_content_legacy' ), 10, 2 );

		// Buscar pedidos por referencia ZX.
		add_filter( 'woocommerce_order_table_search_query_meta_keys', array( self::class, 'search_keys' ) );
		add_filter( 'woocommerce_shop_order_search_fields', array( self::class, 'search_keys' ) );
	}

	public static function order_number( $number, $order ) {
		if ( $order instanceof \WC_Order ) {
			$reference = $order->get_meta( Order_Service::REFERENCE );
			if ( $reference ) {
				return $reference;
			}
		}
		return $number;
	}

	public static function search_keys( array $keys ): array {
		$keys[] = Order_Service::REFERENCE;
		return $keys;
	}

	public static function shipping_box( \WC_Order $order ): void {
		$zone = $order->get_meta( Order_Service::ZONE );
		echo '<div class="zeltron-shipping" style="clear:both;padding-top:12px">';
		if ( $zone ) {
			printf( '<p><strong>Zona:</strong> %s</p>', esc_html( Shipping::zone_label( $zone ) ) );
		}
		woocommerce_wp_text_input(
			array(
				'id'            => Order_Service::CARRIER,
				'label'         => 'Transportadora',
				'value'         => $order->get_meta( Order_Service::CARRIER ),
				'placeholder'   => 'Ej. Coordinadora, Interrapidísimo, mensajero',
				'wrapper_class' => 'form-field-wide',
			)
		);
		woocommerce_wp_text_input(
			array(
				'id'            => Order_Service::TRACKING,
				'label'         => 'Número de guía',
				'value'         => $order->get_meta( Order_Service::TRACKING ),
				'wrapper_class' => 'form-field-wide',
			)
		);
		$phone = preg_replace( '/\D/', '', (string) $order->get_billing_phone() );
		if ( $phone ) {
			if ( 10 === strlen( $phone ) ) {
				$phone = '57' . $phone;
			}
			$text = sprintf(
				'Hola %s, te escribimos de ZELTRON Express para confirmar tu pedido %s por %s (pago contra entrega). ¿Confirmas la dirección %s, %s?',
				$order->get_billing_first_name(),
				$order->get_order_number(),
				wp_strip_all_tags( html_entity_decode( wc_price( $order->get_total() ) ) ),
				$order->get_shipping_address_1(),
				$order->get_shipping_city()
			);
			printf(
				'<p><a class="button" target="_blank" rel="noopener" href="%s">Confirmar por WhatsApp</a></p>',
				esc_url( 'https://wa.me/' . $phone . '?text=' . rawurlencode( $text ) )
			);
		}
		echo '</div>';
	}

	public static function save_shipping_box( $order_id ): void {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- WooCommerce verifica el nonce del formulario del pedido.
		$carrier  = sanitize_text_field( wp_unslash( $_POST[ Order_Service::CARRIER ] ?? '' ) );
		$tracking = sanitize_text_field( wp_unslash( $_POST[ Order_Service::TRACKING ] ?? '' ) );
		// phpcs:enable
		$had_tracking = (string) $order->get_meta( Order_Service::TRACKING );
		$order->update_meta_data( Order_Service::CARRIER, $carrier );
		$order->update_meta_data( Order_Service::TRACKING, $tracking );
		if ( $tracking && $tracking !== $had_tracking ) {
			$order->add_order_note( sprintf( 'Guía registrada: %s %s', $carrier, $tracking ) );
		}
		$order->save();
	}

	public static function columns( array $columns ): array {
		$out = array();
		foreach ( $columns as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'order_status' === $key ) {
				$out['zx_zone']   = 'Zona';
				$out['zx_margin'] = 'Margen';
			}
		}
		return $out;
	}

	public static function column_content_hpos( string $column, $order ): void {
		if ( $order instanceof \WC_Order ) {
			self::render_column( $column, $order );
		}
	}

	public static function column_content_legacy( string $column, int $post_id ): void {
		$order = wc_get_order( $post_id );
		if ( $order ) {
			self::render_column( $column, $order );
		}
	}

	private static function render_column( string $column, \WC_Order $order ): void {
		if ( 'zx_zone' === $column ) {
			$zone = $order->get_meta( Order_Service::ZONE );
			echo $zone ? esc_html( 'express' === $zone ? 'Exprés Cali' : 'Nacional' ) : '—';
		}
		if ( 'zx_margin' === $column ) {
			$margin = self::order_margin( $order );
			echo null === $margin ? '<span style="color:#999">—</span>' : wp_kses_post( wc_price( $margin ) );
		}
	}

	/** Ganancia estimada: productos menos costo de proveedor. null si falta algún costo. */
	public static function order_margin( \WC_Order $order ): ?float {
		$margin = 0.0;
		foreach ( $order->get_items() as $item ) {
			if ( ! $item instanceof \WC_Order_Item_Product ) {
				continue;
			}
			$product = $item->get_product();
			$cost    = $product ? Product_Fields::cost( $product ) : null;
			if ( null === $cost ) {
				return null;
			}
			$margin += (float) $item->get_total() - ( $cost * $item->get_quantity() );
		}
		return $margin;
	}
}
