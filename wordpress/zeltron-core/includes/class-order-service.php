<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Crea y consulta pedidos contra entrega usando la API CRUD de WooCommerce (compatible con HPOS).
 */
final class Order_Service {

	public const REFERENCE    = '_zx_reference';
	public const ZONE         = '_zx_zone';
	public const NEIGHBORHOOD = '_zx_neighborhood';
	public const CONSENT      = '_zx_data_consent';
	public const CARRIER      = '_zx_carrier';
	public const TRACKING     = '_zx_tracking_number';

	/**
	 * @param array $input { reference, customer: {...}, items: [{productId, variant, quantity}] }
	 * @return \WC_Order
	 * @throws \RuntimeException Con un mensaje apto para mostrar al cliente.
	 */
	public static function create( array $input ): \WC_Order {
		$reference = strtoupper( sanitize_text_field( (string) ( $input['reference'] ?? '' ) ) );
		$customer  = (array) ( $input['customer'] ?? array() );
		$items     = (array) ( $input['items'] ?? array() );

		if ( ! preg_match( '/^ZX-\d{8}-[A-Z0-9]{4,8}$/', $reference ) ) {
			throw new \RuntimeException( 'Referencia de pedido inválida.' );
		}

		// Idempotencia: si el frontend reintenta, devolvemos el mismo pedido.
		$existing = self::find_by_reference( $reference );
		if ( $existing ) {
			return $existing;
		}

		$c = array(
			'name'         => sanitize_text_field( (string) ( $customer['name'] ?? '' ) ),
			'phone'        => preg_replace( '/[^\d+]/', '', (string) ( $customer['phone'] ?? '' ) ),
			'email'        => sanitize_email( (string) ( $customer['email'] ?? '' ) ),
			'department'   => sanitize_text_field( (string) ( $customer['department'] ?? '' ) ),
			'city'         => sanitize_text_field( (string) ( $customer['city'] ?? '' ) ),
			'neighborhood' => sanitize_text_field( (string) ( $customer['neighborhood'] ?? '' ) ),
			'address'      => sanitize_text_field( (string) ( $customer['address'] ?? '' ) ),
			'notes'        => sanitize_textarea_field( (string) ( $customer['notes'] ?? '' ) ),
			'consent'      => ! empty( $customer['consent'] ),
		);

		if ( mb_strlen( $c['name'] ) < 2 || strlen( preg_replace( '/\D/', '', $c['phone'] ) ) < 7 || mb_strlen( $c['address'] ) < 5 || '' === $c['city'] ) {
			throw new \RuntimeException( 'Faltan datos de entrega.' );
		}
		if ( ! $c['consent'] ) {
			throw new \RuntimeException( 'Falta la autorización de tratamiento de datos.' );
		}
		if ( ! $items ) {
			throw new \RuntimeException( 'El pedido no tiene productos.' );
		}

		// Validamos todo antes de crear el pedido.
		$lines = array();
		foreach ( $items as $item ) {
			$product  = wc_get_product( absint( $item['productId'] ?? 0 ) );
			$quantity = max( 1, min( 20, absint( $item['quantity'] ?? 1 ) ) );
			if ( ! $product || 'publish' !== $product->get_status() ) {
				throw new \RuntimeException( 'Uno de los productos ya no está disponible.' );
			}
			if ( $product instanceof \WC_Product_Variable ) {
				$product = self::find_variation( $product, (string) ( $item['variant'] ?? '' ) );
				if ( ! $product ) {
					throw new \RuntimeException( 'La variante elegida ya no está disponible.' );
				}
			}
			if ( ! $product->is_in_stock() || ( $product->managing_stock() && ! $product->backorders_allowed() && (int) $product->get_stock_quantity() < $quantity ) ) {
				throw new \RuntimeException( sprintf( 'No hay suficientes unidades de %s.', $product->get_name() ) );
			}
			$lines[] = array( $product, $quantity );
		}

		$order = wc_create_order(
			array(
				'status'        => Order_Statuses::PENDING_CONFIRMATION,
				'customer_note' => $c['notes'],
				'created_via'   => 'zeltron-frontend',
			)
		);
		if ( is_wp_error( $order ) ) {
			throw new \RuntimeException( 'No se pudo crear el pedido.' );
		}

		foreach ( $lines as list( $product, $quantity ) ) {
			$order->add_product( $product, $quantity );
		}

		list( $first, $last ) = self::split_name( $c['name'] );
		$state                = Shipping::state_code( $c['department'] );
		$address              = array(
			'first_name' => $first,
			'last_name'  => $last,
			'address_1'  => $c['address'],
			'address_2'  => $c['neighborhood'] ? 'Barrio ' . $c['neighborhood'] : '',
			'city'       => $c['city'],
			'state'      => $state,
			'country'    => 'CO',
			'phone'      => $c['phone'],
		);
		$order->set_address( array_merge( $address, array( 'email' => $c['email'] ) ), 'billing' );
		$order->set_address( $address, 'shipping' );

		// Envío calculado en el servidor.
		$zone     = Shipping::zone_for( $c['city'], $c['department'] );
		$subtotal = 0.0;
		foreach ( $order->get_items() as $line ) {
			$subtotal += (float) $line->get_total();
		}
		$shipping = new \WC_Order_Item_Shipping();
		$shipping->set_method_title( Shipping::zone_label( $zone ) );
		$shipping->set_method_id( 'zeltron_' . $zone );
		$shipping->set_total( (string) Shipping::fee_for( $subtotal ) );
		$order->add_item( $shipping );

		$order->set_payment_method( 'cod' );
		$order->set_payment_method_title( 'Pago contra entrega' );
		$order->set_currency( get_woocommerce_currency() );

		$order->update_meta_data( self::REFERENCE, $reference );
		$order->update_meta_data( self::ZONE, $zone );
		$order->update_meta_data( self::NEIGHBORHOOD, $c['neighborhood'] );
		$order->update_meta_data( self::CONSENT, gmdate( 'c' ) );

		$order->calculate_totals( false );
		$order->add_order_note( sprintf( 'Pedido recibido desde la tienda (%s). Pendiente de confirmar por WhatsApp.', Shipping::zone_label( $zone ) ) );
		$order->save();

		// Reservamos inventario desde el momento del pedido.
		wc_reduce_stock_levels( $order->get_id() );

		do_action( 'zeltron_order_created', $order );
		return $order;
	}

	public static function find_by_reference( string $reference ): ?\WC_Order {
		$reference = strtoupper( $reference );
		// meta_key/meta_value funciona con el almacenamiento clásico y con HPOS; además verificamos el valor.
		$orders = wc_get_orders(
			array(
				'limit'      => 5,
				'status'     => 'any',
				'type'       => 'shop_order',
				'meta_key'   => self::REFERENCE, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value' => $reference, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		foreach ( $orders as $order ) {
			if ( $order instanceof \WC_Order && $order->get_meta( self::REFERENCE ) === $reference ) {
				return $order;
			}
		}
		return null;
	}

	/** Consulta pública del estado: requiere coincidir con los últimos 7 dígitos del celular. */
	public static function lookup( string $reference, string $phone ): ?\WC_Order {
		$order  = self::find_by_reference( $reference );
		$digits = substr( preg_replace( '/\D/', '', $phone ), -7 );
		if ( ! $order || strlen( $digits ) < 7 ) {
			return null;
		}
		$order_digits = substr( preg_replace( '/\D/', '', (string) $order->get_billing_phone() ), -7 );
		return hash_equals( $order_digits, $digits ) ? $order : null;
	}

	private static function find_variation( \WC_Product_Variable $product, string $name ): ?\WC_Product_Variation {
		foreach ( $product->get_children() as $child_id ) {
			$variation = wc_get_product( $child_id );
			if ( $variation instanceof \WC_Product_Variation && Catalog::variation_name( $variation ) === $name ) {
				return $variation;
			}
		}
		return null;
	}

	/** @return array{0: string, 1: string} */
	private static function split_name( string $name ): array {
		$parts = preg_split( '/\s+/', trim( $name ) );
		$first = array_shift( $parts );
		return array( (string) $first, implode( ' ', $parts ) );
	}
}
