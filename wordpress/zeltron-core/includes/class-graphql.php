<?php
namespace Zeltron\Core;

use GraphQL\Error\UserError;

defined( 'ABSPATH' ) || exit;

/**
 * API GraphQL que consume el frontend (lib/wordpress.ts).
 * Lectura del catálogo: pública. Pedidos: solo servidor a servidor con X-Zeltron-Secret.
 */
final class GraphQL {

	public static function init(): void {
		add_action( 'graphql_register_types', array( self::class, 'register' ) );
	}

	public static function register(): void {
		self::register_types();
		self::register_queries();
		self::register_mutations();
	}

	private static function register_types(): void {
		register_graphql_object_type(
			'ZeltronSpec',
			array(
				'description' => 'Característica de un producto.',
				'fields'      => array(
					'label' => array( 'type' => array( 'non_null' => 'String' ) ),
					'value' => array( 'type' => array( 'non_null' => 'String' ) ),
				),
			)
		);

		register_graphql_object_type(
			'ZeltronProduct',
			array(
				'description' => 'Producto público de la tienda (sin datos de proveedor).',
				'fields'      => array(
					'id'             => array( 'type' => array( 'non_null' => 'ID' ) ),
					'slug'           => array( 'type' => array( 'non_null' => 'String' ) ),
					'name'           => array( 'type' => array( 'non_null' => 'String' ) ),
					'category'       => array( 'type' => array( 'non_null' => 'String' ) ),
					'subcategory'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'brand'          => array( 'type' => 'String' ),
					'description'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'price'          => array( 'type' => array( 'non_null' => 'Int' ) ),
					'compareAtPrice' => array( 'type' => 'Int' ),
					'images'         => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'String' ) ) ) ),
					'variants'       => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'String' ) ) ) ),
					'specs'          => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronSpec' ) ) ) ),
					'stock'          => array( 'type' => array( 'non_null' => 'Int' ) ),
					'isBestSeller'   => array( 'type' => array( 'non_null' => 'Boolean' ) ),
					'freeShipping'   => array( 'type' => array( 'non_null' => 'Boolean' ) ),
				),
			)
		);

		register_graphql_object_type(
			'ZeltronCategory',
			array(
				'fields' => array(
					'name'          => array( 'type' => array( 'non_null' => 'String' ) ),
					'subcategories' => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'String' ) ) ) ),
				),
			)
		);

		register_graphql_object_type(
			'ZeltronStoreSettings',
			array(
				'fields' => array(
					'whatsappNumber'    => array( 'type' => 'String' ),
					'shippingFee'       => array( 'type' => array( 'non_null' => 'Int' ) ),
					'freeShippingFrom'  => array( 'type' => array( 'non_null' => 'Int' ) ),
					'expressCities'     => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'String' ) ) ) ),
					'expressDepartment' => array( 'type' => 'String' ),
				),
			)
		);

		register_graphql_object_type(
			'ZeltronOrderStatus',
			array(
				'fields' => array(
					'orderNumber'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'status'         => array( 'type' => array( 'non_null' => 'String' ) ),
					'statusLabel'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'step'           => array(
						'type'        => array( 'non_null' => 'String' ),
						'description' => 'recibido | confirmacion | despachado | en-camino | entregado | cancelado',
					),
					'zone'           => array( 'type' => 'String' ),
					'carrier'        => array( 'type' => 'String' ),
					'trackingNumber' => array( 'type' => 'String' ),
					'total'          => array( 'type' => array( 'non_null' => 'Int' ) ),
					'createdAt'      => array( 'type' => 'String' ),
				),
			)
		);

		register_graphql_input_type(
			'ZeltronOrderCustomerInput',
			array(
				'fields' => array(
					'name'         => array( 'type' => array( 'non_null' => 'String' ) ),
					'phone'        => array( 'type' => array( 'non_null' => 'String' ) ),
					'email'        => array( 'type' => 'String' ),
					'department'   => array( 'type' => array( 'non_null' => 'String' ) ),
					'city'         => array( 'type' => array( 'non_null' => 'String' ) ),
					'neighborhood' => array( 'type' => 'String' ),
					'address'      => array( 'type' => array( 'non_null' => 'String' ) ),
					'notes'        => array( 'type' => 'String' ),
					'consent'      => array( 'type' => array( 'non_null' => 'Boolean' ) ),
					'zone'         => array( 'type' => 'String' ),
				),
			)
		);

		register_graphql_input_type(
			'ZeltronOrderItemInput',
			array(
				'fields' => array(
					'productId' => array( 'type' => array( 'non_null' => 'ID' ) ),
					'variant'   => array( 'type' => 'String' ),
					'quantity'  => array( 'type' => array( 'non_null' => 'Int' ) ),
				),
			)
		);
	}

	private static function register_queries(): void {
		register_graphql_field(
			'RootQuery',
			'zeltronProducts',
			array(
				'type'        => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronProduct' ) ) ),
				'description' => 'Catálogo publicado de la tienda.',
				'resolve'     => static fn() => Catalog::products(),
			)
		);

		register_graphql_field(
			'RootQuery',
			'zeltronCategories',
			array(
				'type'        => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronCategory' ) ) ),
				'description' => 'Categorías y subcategorías con productos.',
				'resolve'     => static fn() => Catalog::categories(),
			)
		);

		register_graphql_field(
			'RootQuery',
			'zeltronStoreSettings',
			array(
				'type'    => array( 'non_null' => 'ZeltronStoreSettings' ),
				'resolve' => static fn() => array(
					'whatsappNumber'    => (string) Settings::get( 'whatsapp_number' ),
					'shippingFee'       => (int) Settings::get( 'shipping_fee' ),
					'freeShippingFrom'  => (int) Settings::get( 'free_shipping_from' ),
					'expressCities'     => Settings::express_cities(),
					'expressDepartment' => (string) Settings::get( 'express_department' ),
				),
			)
		);

		register_graphql_field(
			'RootQuery',
			'zeltronOrder',
			array(
				'type'        => 'ZeltronOrderStatus',
				'description' => 'Estado de un pedido. Requiere X-Zeltron-Secret y los últimos 7 dígitos del celular.',
				'args'        => array(
					'number' => array( 'type' => array( 'non_null' => 'String' ) ),
					'phone'  => array( 'type' => array( 'non_null' => 'String' ) ),
				),
				'resolve'     => static function ( $root, array $args ) {
					self::require_secret();
					$order = Order_Service::lookup( (string) $args['number'], (string) $args['phone'] );
					return $order ? self::order_status( $order ) : null;
				},
			)
		);
	}

	private static function register_mutations(): void {
		register_graphql_mutation(
			'zeltronCreateOrder',
			array(
				'description'         => 'Crea un pedido contra entrega. Solo para el servidor del frontend.',
				'inputFields'         => array(
					'reference' => array( 'type' => array( 'non_null' => 'String' ) ),
					'customer'  => array( 'type' => array( 'non_null' => 'ZeltronOrderCustomerInput' ) ),
					'items'     => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronOrderItemInput' ) ) ) ),
				),
				'outputFields'        => array(
					'orderNumber' => array( 'type' => 'String' ),
					'status'      => array( 'type' => 'String' ),
				),
				'mutateAndGetPayload' => static function ( array $input ) {
					self::require_secret();
					try {
						$order = Order_Service::create( $input );
					} catch ( \RuntimeException $e ) {
						throw new UserError( esc_html( $e->getMessage() ) );
					}
					return array(
						'orderNumber' => (string) $order->get_order_number(),
						'status'      => $order->get_status(),
					);
				},
			)
		);
	}

	private static function require_secret(): void {
		if ( ! Settings::request_is_authorized() ) {
			throw new UserError( 'No autorizado.' );
		}
	}

	private static function order_status( \WC_Order $order ): array {
		$status = $order->get_status();
		$labels = wc_get_order_statuses();
		$date   = $order->get_date_created();
		return array(
			'orderNumber'    => (string) $order->get_order_number(),
			'status'         => $status,
			'statusLabel'    => (string) ( $labels[ 'wc-' . $status ] ?? $status ),
			'step'           => Order_Statuses::timeline_step( $status ),
			'zone'           => (string) $order->get_meta( Order_Service::ZONE ),
			'carrier'        => (string) $order->get_meta( Order_Service::CARRIER ),
			'trackingNumber' => (string) $order->get_meta( Order_Service::TRACKING ),
			'total'          => (int) round( (float) $order->get_total() ),
			'createdAt'      => $date ? $date->date( 'c' ) : null,
		);
	}
}
