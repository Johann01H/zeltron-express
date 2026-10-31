<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Arranque del plugin: verifica dependencias y conecta cada módulo.
 */
final class Plugin {

	public static function boot(): void {
		if ( ! class_exists( 'WooCommerce' ) || ! function_exists( 'register_graphql_field' ) ) {
			add_action( 'admin_notices', array( self::class, 'missing_dependencies_notice' ) );
			return;
		}

		Settings::init();
		Order_Statuses::init();
		Product_Fields::init();
		Order_Admin::init();
		Revalidation::init();
		Security::init();
		GraphQL::init();
		Image_Linker::init();
		Customer_Accounts::init();
		Customer_Profile::init();
	}

	public static function missing_dependencies_notice(): void {
		echo '<div class="notice notice-error"><p><strong>Zeltron Core</strong> necesita los plugins <strong>WooCommerce</strong> y <strong>WPGraphQL</strong> activos.</p></div>';
	}
}
