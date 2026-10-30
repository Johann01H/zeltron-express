<?php
/**
 * Plugin Name:       Zeltron Core
 * Plugin URI:        https://zeltronexpress.com
 * Description:       Núcleo headless de ZELTRON Express: API GraphQL para el frontend en Next.js, pedidos contra entrega, datos de proveedor y márgenes, y revalidación automática de la tienda.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Requires Plugins:  woocommerce, wp-graphql
 * Author:            ZELTRON S.A.S.
 * Text Domain:       zeltron-core
 * License:           Propietaria
 */

defined( 'ABSPATH' ) || exit;

define( 'ZELTRON_CORE_VERSION', '1.0.0' );
define( 'ZELTRON_CORE_FILE', __FILE__ );
define( 'ZELTRON_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'ZELTRON_CORE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Autocarga: Zeltron\Core\Order_Service → includes/class-order-service.php
 */
spl_autoload_register(
	static function ( string $class ): void {
		$prefix = 'Zeltron\\Core\\';
		if ( ! str_starts_with( $class, $prefix ) ) {
			return;
		}
		$name = strtolower( str_replace( '_', '-', substr( $class, strlen( $prefix ) ) ) );
		$file = ZELTRON_CORE_DIR . 'includes/class-' . $name . '.php';
		if ( is_readable( $file ) ) {
			require_once $file;
		}
	}
);

// Compatibilidad con el almacenamiento de pedidos de alto rendimiento (HPOS) de WooCommerce.
add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', ZELTRON_CORE_FILE, true );
		}
	}
);

register_activation_hook( __FILE__, array( \Zeltron\Core\Settings::class, 'on_activate' ) );

add_action( 'plugins_loaded', array( \Zeltron\Core\Plugin::class, 'boot' ), 20 );
