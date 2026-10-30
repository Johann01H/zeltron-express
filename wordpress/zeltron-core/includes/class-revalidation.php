<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Avisa a la tienda (Next.js /api/revalidate) cuando cambia el catálogo,
 * para que los productos se actualicen sin esperar a que venza la caché.
 */
final class Revalidation {

	private static bool $pending = false;

	public static function init(): void {
		$hooks = array(
			'woocommerce_update_product',
			'woocommerce_new_product',
			'woocommerce_delete_product',
			'woocommerce_trash_product',
			'woocommerce_product_set_stock',
			'woocommerce_variation_set_stock',
			'woocommerce_product_set_stock_status',
			'created_product_cat',
			'edited_product_cat',
			'delete_product_cat',
		);
		foreach ( $hooks as $hook ) {
			add_action( $hook, array( self::class, 'schedule' ) );
		}
		add_action( 'transition_post_status', array( self::class, 'on_status_change' ), 10, 3 );
	}

	public static function on_status_change( $new, $old, $post ): void {
		if ( $post instanceof \WP_Post && 'product' === $post->post_type && $new !== $old ) {
			self::schedule();
		}
	}

	/** Se agrupan todos los cambios de una misma petición en un solo aviso. */
	public static function schedule(): void {
		Catalog::flush();
		if ( self::$pending ) {
			return;
		}
		self::$pending = true;
		add_action( 'shutdown', array( self::class, 'send' ) );
	}

	public static function send(): void {
		$url    = Settings::frontend_url();
		$secret = Settings::api_secret();
		if ( ! $url || ! $secret ) {
			return;
		}
		wp_remote_post(
			$url . '/api/revalidate',
			array(
				'blocking' => false,
				'timeout'  => 3,
				'headers'  => array( 'x-zeltron-secret' => $secret ),
			)
		);
	}
}
