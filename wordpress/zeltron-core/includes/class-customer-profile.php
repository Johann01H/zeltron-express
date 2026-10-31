<?php
namespace Zeltron\Core;

use GraphQL\Error\UserError;

defined( 'ABSPATH' ) || exit;

/**
 * «Mi cuenta» del cliente: datos personales, foto de perfil, direcciones guardadas,
 * cambio de contraseña e historial de pedidos con sus productos.
 * Todas las operaciones llegan desde el servidor de Next.js con X-Zeltron-Secret
 * y el token de sesión del cliente (ver Customer_Accounts).
 */
final class Customer_Profile {

	private const ADDRESSES_META = '_zx_addresses';
	private const AVATAR_META    = '_zx_avatar_id';
	private const FAVORITES_META = '_zx_favorites';
	private const MAX_FAVORITES  = 200;
	private const MAX_ADDRESSES  = 8;
	private const MAX_AVATAR     = 3 * MB_IN_BYTES;
	private const AVATAR_TYPES   = array(
		'image/jpeg' => 'jpg',
		'image/png'  => 'png',
		'image/webp' => 'webp',
	);

	public static function init(): void {
		add_action( 'graphql_register_types', array( self::class, 'register' ) );
		// La foto que sube el cliente también se ve en el panel de WordPress.
		add_filter( 'pre_get_avatar_data', array( self::class, 'admin_avatar' ), 10, 2 );
	}

	/* ---------------------------------------------------------------------
	 * Lectura
	 * ------------------------------------------------------------------- */

	public static function data( int $user_id ): array {
		$user     = get_userdata( $user_id );
		$customer = new \WC_Customer( $user_id );
		$first    = $customer->get_first_name();
		$last     = $customer->get_last_name();
		$name     = trim( $first . ' ' . $last );
		if ( '' === $name ) {
			$name = $user ? $user->display_name : '';
		}

		$orders = self::orders( $user_id, $user ? $user->user_email : '' );
		$spent  = 0;
		foreach ( $orders as $order ) {
			if ( 'cancelado' !== $order['step'] ) {
				$spent += $order['total'];
			}
		}

		return array(
			'id'          => (string) $user_id,
			'firstName'   => $first,
			'lastName'    => $last,
			'name'        => $name,
			'email'       => $user ? $user->user_email : '',
			'phone'       => $customer->get_billing_phone(),
			'avatarUrl'   => self::avatar_url( $user_id ),
			'memberSince' => self::spanish_date( $user ? (int) strtotime( $user->user_registered ) : time(), true ),
			'orderCount'  => count( $orders ),
			'totalSpent'  => $spent,
			'addresses'   => self::addresses( $user_id ),
			'favorites'   => self::favorites( $user_id ),
			'orders'      => $orders,
		);
	}

	/** Pedidos de la cuenta y los que hizo como invitado con el mismo correo. */
	private static function orders( int $user_id, string $email ): array {
		$orders = wc_get_orders(
			array(
				'customer' => array_values( array_filter( array( $user_id, $email ) ) ),
				'limit'    => 50,
				'orderby'  => 'date',
				'order'    => 'DESC',
				'type'     => 'shop_order',
			)
		);
		$labels = wc_get_order_statuses();
		$out    = array();
		foreach ( $orders as $order ) {
			if ( ! $order instanceof \WC_Order ) {
				continue;
			}
			$items = array();
			foreach ( $order->get_items() as $item ) {
				if ( ! $item instanceof \WC_Order_Item_Product ) {
					continue;
				}
				$product = $item->get_product();
				$image   = $product ? wp_get_attachment_image_url( (int) ( $product->get_image_id() ?: ( $product->get_parent_id() ? wc_get_product( $product->get_parent_id() )->get_image_id() : 0 ) ), 'thumbnail' ) : '';
				$variant = $product instanceof \WC_Product_Variation ? Catalog::variation_name( $product ) : '';
				$items[] = array(
					'name'     => $product && $product->get_parent_id() ? (string) wc_get_product( $product->get_parent_id() )->get_name() : $item->get_name(),
					'variant'  => $variant,
					'quantity' => (int) $item->get_quantity(),
					'total'    => (int) round( (float) $item->get_total() ),
					'image'    => $image ? (string) $image : '',
					'slug'     => $product ? (string) ( $product->get_parent_id() ? get_post_field( 'post_name', $product->get_parent_id() ) : $product->get_slug() ) : '',
				);
			}
			$date   = $order->get_date_created();
			$status = $order->get_status();
			$out[]  = array(
				'number'         => (string) $order->get_order_number(),
				'date'           => $date ? self::spanish_date( $date->getTimestamp(), false ) : '',
				'itemCount'      => (int) $order->get_item_count(),
				'total'          => (int) round( (float) $order->get_total() ),
				'shipping'       => (int) round( (float) $order->get_shipping_total() ),
				'status'         => (string) ( $labels[ 'wc-' . $status ] ?? $status ),
				'step'           => Order_Statuses::timeline_step( $status ),
				'address'        => trim( $order->get_shipping_address_1() . ' · ' . $order->get_shipping_address_2(), ' ·' ),
				'city'           => trim( $order->get_shipping_city() . ', ' . self::state_name( $order->get_shipping_state() ), ', ' ),
				'carrier'        => (string) $order->get_meta( Order_Service::CARRIER ),
				'trackingNumber' => (string) $order->get_meta( Order_Service::TRACKING ),
				'items'          => $items,
			);
		}
		return $out;
	}

	/* ---------------------------------------------------------------------
	 * Datos personales y contraseña
	 * ------------------------------------------------------------------- */

	public static function update_details( int $user_id, array $input ): void {
		$first = Customer_Accounts::clean_text( (string) ( $input['firstName'] ?? '' ), 40 );
		$last  = Customer_Accounts::clean_text( (string) ( $input['lastName'] ?? '' ), 40 );
		$phone = preg_replace( '/[^\d+]/', '', (string) ( $input['phone'] ?? '' ) );

		if ( mb_strlen( $first ) < 2 ) {
			throw new UserError( 'Escribe tu nombre.' );
		}
		if ( '' !== $phone && ( strlen( $phone ) < 7 || strlen( $phone ) > 15 ) ) {
			throw new UserError( 'Revisa el número de celular.' );
		}

		$customer = new \WC_Customer( $user_id );
		$customer->set_first_name( $first );
		$customer->set_last_name( $last );
		$customer->set_display_name( trim( $first . ' ' . $last ) );
		$customer->set_billing_first_name( $first );
		$customer->set_billing_last_name( $last );
		$customer->set_billing_phone( $phone );
		$customer->save();
	}

	public static function change_password( int $user_id, string $token, string $current, string $new ): void {
		$user = get_userdata( $user_id );
		if ( ! $user || ! wp_check_password( $current, $user->user_pass, $user_id ) ) {
			throw new UserError( 'La contraseña actual no es correcta.' );
		}
		Customer_Accounts::assert_password( $new );
		if ( $current === $new ) {
			throw new UserError( 'La nueva contraseña debe ser distinta a la actual.' );
		}
		wp_set_password( $new, $user_id );
		// wp_set_password borra las sesiones de WordPress; las de la tienda se cierran salvo la actual.
		Customer_Accounts::keep_only_session( $user_id, $token );
	}

	/* ---------------------------------------------------------------------
	 * Direcciones
	 * ------------------------------------------------------------------- */

	private static function addresses( int $user_id ): array {
		$saved = get_user_meta( $user_id, self::ADDRESSES_META, true );
		if ( is_array( $saved ) ) {
			return array_values( $saved );
		}
		// Clientes anteriores: se toma la dirección de facturación de WooCommerce.
		$customer = new \WC_Customer( $user_id );
		if ( ! $customer->get_billing_address_1() ) {
			return array();
		}
		$state = $customer->get_billing_state();
		return array(
			array(
				'id'           => 'principal',
				'label'        => 'Casa',
				'recipient'    => trim( $customer->get_billing_first_name() . ' ' . $customer->get_billing_last_name() ),
				'phone'        => $customer->get_billing_phone(),
				'department'   => self::state_name( $state ),
				'city'         => $customer->get_billing_city(),
				'neighborhood' => preg_replace( '/^Barrio\s+/i', '', $customer->get_billing_address_2() ),
				'street'       => $customer->get_billing_address_1(),
				'notes'        => '',
				'isPrimary'    => true,
			),
		);
	}

	public static function save_address( int $user_id, array $input ): void {
		$clean = static fn( string $key, int $max ) => Customer_Accounts::clean_text( (string) ( $input[ $key ] ?? '' ), $max );
		$address = array(
			'id'           => preg_replace( '/[^a-z0-9-]/', '', (string) ( $input['id'] ?? '' ) ),
			'label'        => $clean( 'label', 30 ) ?: 'Casa',
			'recipient'    => $clean( 'recipient', 80 ),
			'phone'        => preg_replace( '/[^\d+]/', '', (string) ( $input['phone'] ?? '' ) ),
			'department'   => $clean( 'department', 40 ),
			'city'         => $clean( 'city', 60 ),
			'neighborhood' => $clean( 'neighborhood', 60 ),
			'street'       => $clean( 'street', 120 ),
			'notes'        => Customer_Accounts::clean_text( (string) ( $input['notes'] ?? '' ), 200 ),
			'isPrimary'    => ! empty( $input['isPrimary'] ),
		);

		if ( mb_strlen( $address['recipient'] ) < 2 ) {
			throw new UserError( 'Escribe quién recibe el pedido.' );
		}
		if ( strlen( $address['phone'] ) < 7 || strlen( $address['phone'] ) > 15 ) {
			throw new UserError( 'Revisa el celular de quien recibe.' );
		}
		if ( '' === $address['department'] || mb_strlen( $address['city'] ) < 2 ) {
			throw new UserError( 'Elige el departamento y escribe la ciudad.' );
		}
		if ( mb_strlen( $address['street'] ) < 5 ) {
			throw new UserError( 'Escribe la dirección completa (calle, número y apartamento).' );
		}

		$list = self::addresses( $user_id );
		if ( '' === $address['id'] ) {
			if ( count( $list ) >= self::MAX_ADDRESSES ) {
				throw new UserError( 'Puedes guardar hasta 8 direcciones. Elimina una para agregar otra.' );
			}
			$address['id'] = substr( wp_generate_uuid4(), 0, 8 );
			$list[]        = $address;
		} else {
			$found = false;
			foreach ( $list as $i => $existing ) {
				if ( $existing['id'] === $address['id'] ) {
					$list[ $i ] = $address;
					$found      = true;
				}
			}
			if ( ! $found ) {
				throw new UserError( 'No encontramos esa dirección.' );
			}
		}

		self::store_addresses( $user_id, $list, $address['isPrimary'] ? $address['id'] : null );
	}

	public static function delete_address( int $user_id, string $id ): void {
		$list = array_values( array_filter( self::addresses( $user_id ), static fn( $a ) => $a['id'] !== $id ) );
		self::store_addresses( $user_id, $list, null );
	}

	public static function set_primary_address( int $user_id, string $id ): void {
		self::store_addresses( $user_id, self::addresses( $user_id ), $id );
	}

	/** Guarda la lista con una sola dirección principal y la copia a WooCommerce. */
	private static function store_addresses( int $user_id, array $list, ?string $primary_id ): void {
		if ( null === $primary_id ) {
			foreach ( $list as $a ) {
				if ( ! empty( $a['isPrimary'] ) ) {
					$primary_id = $a['id'];
					break;
				}
			}
		}
		if ( null === $primary_id && $list ) {
			$primary_id = $list[0]['id'];
		}
		$primary = null;
		foreach ( $list as $i => $a ) {
			$list[ $i ]['isPrimary'] = $a['id'] === $primary_id;
			if ( $list[ $i ]['isPrimary'] ) {
				$primary = $list[ $i ];
			}
		}
		update_user_meta( $user_id, self::ADDRESSES_META, array_values( $list ) );

		if ( $primary ) {
			$parts    = preg_split( '/\s+/', $primary['recipient'], 2 );
			$customer = new \WC_Customer( $user_id );
			foreach ( array( 'billing', 'shipping' ) as $type ) {
				$customer->{"set_{$type}_first_name"}( $parts[0] ?? '' );
				$customer->{"set_{$type}_last_name"}( $parts[1] ?? '' );
				$customer->{"set_{$type}_address_1"}( $primary['street'] );
				$customer->{"set_{$type}_address_2"}( $primary['neighborhood'] ? 'Barrio ' . $primary['neighborhood'] : '' );
				$customer->{"set_{$type}_city"}( $primary['city'] );
				$customer->{"set_{$type}_state"}( Shipping::state_code( $primary['department'] ) );
				$customer->{"set_{$type}_country"}( 'CO' );
			}
			$customer->save();
		}
	}

	/* ---------------------------------------------------------------------
	 * Favoritos
	 * ------------------------------------------------------------------- */

	/** @return string[] IDs de productos guardados (solo los que siguen publicados). */
	public static function favorites( int $user_id ): array {
		$ids = get_user_meta( $user_id, self::FAVORITES_META, true );
		$ids = is_array( $ids ) ? array_map( 'intval', $ids ) : array();
		$ids = array_filter( $ids, static fn( $id ) => $id > 0 && 'product' === get_post_type( $id ) && 'publish' === get_post_status( $id ) );
		return array_values( array_map( 'strval', array_unique( $ids ) ) );
	}

	/** Reemplaza la lista completa (la tienda ya combina la del navegador con la de la cuenta). */
	public static function set_favorites( int $user_id, array $ids ): array {
		$clean = array();
		foreach ( $ids as $id ) {
			$id = (int) $id;
			if ( $id > 0 && ! in_array( $id, $clean, true ) && 'product' === get_post_type( $id ) && 'publish' === get_post_status( $id ) ) {
				$clean[] = $id;
			}
			if ( count( $clean ) >= self::MAX_FAVORITES ) {
				break;
			}
		}
		update_user_meta( $user_id, self::FAVORITES_META, $clean );
		return array_map( 'strval', $clean );
	}

	/* ---------------------------------------------------------------------
	 * Foto de perfil
	 * ------------------------------------------------------------------- */

	public static function avatar_url( int $user_id ): string {
		$id = (int) get_user_meta( $user_id, self::AVATAR_META, true );
		if ( ! $id ) {
			return '';
		}
		$url = wp_get_attachment_image_url( $id, 'medium' ) ?: wp_get_attachment_url( $id );
		return $url ? (string) $url : '';
	}

	public static function set_avatar( int $user_id, string $data_url ): void {
		if ( ! preg_match( '#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$#', $data_url, $m ) ) {
			throw new UserError( 'Sube una imagen JPG, PNG o WebP.' );
		}
		$bytes = base64_decode( preg_replace( '/\s+/', '', $m[2] ), true );
		if ( false === $bytes || strlen( $bytes ) > self::MAX_AVATAR ) {
			throw new UserError( 'La imagen es demasiado pesada. Usa una de menos de 3 MB.' );
		}
		$info = @getimagesizefromstring( $bytes ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		if ( ! $info || ! isset( self::AVATAR_TYPES[ $info['mime'] ] ) || $info[0] > 4000 || $info[1] > 4000 ) {
			throw new UserError( 'No pudimos leer la imagen. Prueba con otra foto.' );
		}

		$ext    = self::AVATAR_TYPES[ $info['mime'] ];
		$upload = wp_upload_bits( 'avatar-' . $user_id . '-' . time() . '.' . $ext, null, $bytes );
		if ( ! empty( $upload['error'] ) ) {
			throw new UserError( 'No pudimos guardar la imagen. Intenta de nuevo.' );
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => $info['mime'],
				'post_title'     => 'Foto de perfil — cliente ' . $user_id,
				'post_status'    => 'inherit',
				'post_author'    => $user_id,
			),
			$upload['file']
		);
		if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
			wp_delete_file( $upload['file'] );
			throw new UserError( 'No pudimos guardar la imagen. Intenta de nuevo.' );
		}
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $upload['file'] ) );
		update_post_meta( $attachment_id, '_zx_customer_avatar', $user_id );

		self::remove_avatar( $user_id );
		update_user_meta( $user_id, self::AVATAR_META, (int) $attachment_id );
	}

	public static function remove_avatar( int $user_id ): void {
		$old = (int) get_user_meta( $user_id, self::AVATAR_META, true );
		if ( $old && (int) get_post_meta( $old, '_zx_customer_avatar', true ) === $user_id ) {
			wp_delete_attachment( $old, true );
		}
		delete_user_meta( $user_id, self::AVATAR_META );
	}

	public static function admin_avatar( array $args, $id_or_email ): array {
		$user_id = 0;
		if ( is_numeric( $id_or_email ) ) {
			$user_id = (int) $id_or_email;
		} elseif ( $id_or_email instanceof \WP_User ) {
			$user_id = $id_or_email->ID;
		} elseif ( is_string( $id_or_email ) && is_email( $id_or_email ) ) {
			$user = get_user_by( 'email', $id_or_email );
			$user_id = $user ? $user->ID : 0;
		}
		$url = $user_id ? self::avatar_url( $user_id ) : '';
		if ( $url ) {
			$args['url'] = $url;
		}
		return $args;
	}

	/* ---------------------------------------------------------------------
	 * Utilidades
	 * ------------------------------------------------------------------- */

	/** Fechas en español sin depender del idioma configurado en WordPress. */
	private static function spanish_date( int $timestamp, bool $month_and_year ): string {
		$months = array( 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre' );
		$month  = $months[ (int) wp_date( 'n', $timestamp ) - 1 ];
		return $month_and_year
			? $month . ' de ' . wp_date( 'Y', $timestamp )
			: wp_date( 'j', $timestamp ) . ' ' . substr( $month, 0, 3 ) . ' ' . wp_date( 'Y', $timestamp );
	}

	private static function state_name( string $code ): string {
		$states = WC()->countries ? WC()->countries->get_states( 'CO' ) : array();
		return is_array( $states ) && isset( $states[ $code ] ) ? (string) $states[ $code ] : $code;
	}

	/** Usuario dueño del token o error de sesión. */
	private static function user_from( array $input ): int {
		Customer_Accounts::require_secret();
		$user_id = Customer_Accounts::user_for_token( (string) ( $input['token'] ?? '' ) );
		if ( ! $user_id ) {
			throw new UserError( 'Tu sesión expiró. Inicia sesión de nuevo.' );
		}
		return $user_id;
	}

	/* ---------------------------------------------------------------------
	 * GraphQL
	 * ------------------------------------------------------------------- */

	public static function register(): void {
		$string = array( 'non_null' => 'String' );
		$int    = array( 'non_null' => 'Int' );

		register_graphql_object_type(
			'ZeltronAddress',
			array(
				'fields' => array(
					'id'           => array( 'type' => $string ),
					'label'        => array( 'type' => $string ),
					'recipient'    => array( 'type' => $string ),
					'phone'        => array( 'type' => $string ),
					'department'   => array( 'type' => $string ),
					'city'         => array( 'type' => $string ),
					'neighborhood' => array( 'type' => $string ),
					'street'       => array( 'type' => $string ),
					'notes'        => array( 'type' => $string ),
					'isPrimary'    => array( 'type' => array( 'non_null' => 'Boolean' ) ),
				),
			)
		);
		register_graphql_object_type(
			'ZeltronCustomerOrderItem',
			array(
				'fields' => array(
					'name'     => array( 'type' => $string ),
					'variant'  => array( 'type' => $string ),
					'quantity' => array( 'type' => $int ),
					'total'    => array( 'type' => $int ),
					'image'    => array( 'type' => $string ),
					'slug'     => array( 'type' => $string ),
				),
			)
		);
		register_graphql_object_type(
			'ZeltronCustomerOrder',
			array(
				'fields' => array(
					'number'         => array( 'type' => $string ),
					'date'           => array( 'type' => $string ),
					'itemCount'      => array( 'type' => $int ),
					'total'          => array( 'type' => $int ),
					'shipping'       => array( 'type' => $int ),
					'status'         => array( 'type' => $string ),
					'step'           => array( 'type' => $string ),
					'address'        => array( 'type' => $string ),
					'city'           => array( 'type' => $string ),
					'carrier'        => array( 'type' => $string ),
					'trackingNumber' => array( 'type' => $string ),
					'items'          => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronCustomerOrderItem' ) ) ) ),
				),
			)
		);
		register_graphql_object_type(
			'ZeltronCustomer',
			array(
				'fields' => array(
					'id'          => array( 'type' => array( 'non_null' => 'ID' ) ),
					'firstName'   => array( 'type' => $string ),
					'lastName'    => array( 'type' => $string ),
					'name'        => array( 'type' => $string ),
					'email'       => array( 'type' => $string ),
					'phone'       => array( 'type' => $string ),
					'avatarUrl'   => array( 'type' => $string ),
					'memberSince' => array( 'type' => $string ),
					'orderCount'  => array( 'type' => $int ),
					'totalSpent'  => array( 'type' => $int ),
					'addresses'   => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronAddress' ) ) ) ),
					'favorites'   => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'String' ) ) ) ),
					'orders'      => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronCustomerOrder' ) ) ) ),
				),
			)
		);

		$token  = array( 'token' => array( 'type' => $string ) );
		$output = array( 'customer' => array( 'type' => 'ZeltronCustomer' ) );

		$mutations = array(
			'zeltronUpdateProfile'    => array(
				'input' => array(
					'firstName' => array( 'type' => $string ),
					'lastName'  => array( 'type' => 'String' ),
					'phone'     => array( 'type' => 'String' ),
				),
				'run'   => static fn( int $uid, array $in ) => self::update_details( $uid, $in ),
			),
			'zeltronChangePassword'   => array(
				'input' => array(
					'currentPassword' => array( 'type' => $string ),
					'newPassword'     => array( 'type' => $string ),
				),
				'run'   => static fn( int $uid, array $in ) => self::change_password( $uid, (string) $in['token'], (string) $in['currentPassword'], (string) $in['newPassword'] ),
			),
			'zeltronSaveAddress'      => array(
				'input' => array(
					'id'           => array( 'type' => 'String' ),
					'label'        => array( 'type' => 'String' ),
					'recipient'    => array( 'type' => $string ),
					'phone'        => array( 'type' => $string ),
					'department'   => array( 'type' => $string ),
					'city'         => array( 'type' => $string ),
					'neighborhood' => array( 'type' => 'String' ),
					'street'       => array( 'type' => $string ),
					'notes'        => array( 'type' => 'String' ),
					'isPrimary'    => array( 'type' => 'Boolean' ),
				),
				'run'   => static fn( int $uid, array $in ) => self::save_address( $uid, $in ),
			),
			'zeltronDeleteAddress'    => array(
				'input' => array( 'id' => array( 'type' => $string ) ),
				'run'   => static fn( int $uid, array $in ) => self::delete_address( $uid, (string) $in['id'] ),
			),
			'zeltronSetPrimaryAddress' => array(
				'input' => array( 'id' => array( 'type' => $string ) ),
				'run'   => static fn( int $uid, array $in ) => self::set_primary_address( $uid, (string) $in['id'] ),
			),
			'zeltronSetAvatar'        => array(
				'input' => array( 'image' => array( 'type' => $string, 'description' => 'Imagen como data URL (base64).' ) ),
				'run'   => static fn( int $uid, array $in ) => self::set_avatar( $uid, (string) $in['image'] ),
			),
			'zeltronRemoveAvatar'     => array(
				'input' => array(),
				'run'   => static fn( int $uid, array $in ) => self::remove_avatar( $uid ),
			),
		);

		// Liviana: se llama cada vez que el cliente toca un corazón, sin recalcular pedidos.
		register_graphql_mutation(
			'zeltronSetFavorites',
			array(
				'inputFields'         => $token + array( 'ids' => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'String' ) ) ) ) ),
				'outputFields'        => array( 'favorites' => array( 'type' => array( 'list_of' => 'String' ) ) ),
				'mutateAndGetPayload' => static function ( array $input ) {
					$user_id = self::user_from( $input );
					return array( 'favorites' => self::set_favorites( $user_id, (array) $input['ids'] ) );
				},
			)
		);

		foreach ( $mutations as $name => $def ) {
			$run = $def['run'];
			register_graphql_mutation(
				$name,
				array(
					'inputFields'         => $token + $def['input'],
					'outputFields'        => $output,
					'mutateAndGetPayload' => static function ( array $input ) use ( $run ) {
						$user_id = self::user_from( $input );
						$run( $user_id, $input );
						return array( 'customer' => self::data( $user_id ) );
					},
				)
			);
		}
	}
}
