<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Endurecimiento para un WordPress que solo es panel + API.
 */
final class Security {

	public static function init(): void {
		// XML-RPC no se usa en un WordPress headless: se bloquea por completo.
		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			status_header( 403 );
			exit;
		}
		add_filter( 'xmlrpc_enabled', '__return_false' );
		add_filter( 'xmlrpc_methods', '__return_empty_array' );
		add_filter( 'rest_endpoints', array( self::class, 'hide_user_endpoints' ) );
		add_action( 'template_redirect', array( self::class, 'redirect_public_site' ), 1 );
		// Sin listado de usuarios en WPGraphQL para visitantes anónimos.
		add_filter( 'graphql_connection_query_args', array( self::class, 'limit_public_users' ), 10, 2 );
	}

	public static function hide_user_endpoints( array $endpoints ): array {
		if ( ! is_user_logged_in() ) {
			unset( $endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
		}
		return $endpoints;
	}

	/** Las visitas al sitio público de WordPress van a la tienda real. */
	public static function redirect_public_site(): void {
		if ( ! Settings::get( 'redirect_frontend' ) || is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
			return;
		}
		if ( ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ( function_exists( 'is_graphql_http_request' ) && is_graphql_http_request() ) ) {
			return;
		}
		if ( is_user_logged_in() && current_user_can( 'edit_posts' ) && isset( $_GET['preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$frontend = Settings::frontend_url();
		if ( ! $frontend ) {
			return;
		}
		$target = $frontend;
		if ( function_exists( 'is_product' ) && is_product() ) {
			$target .= '/producto/' . get_post_field( 'post_name', get_queried_object_id() );
		}
		wp_redirect( $target, 301, 'Zeltron Core' ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- destino configurado por el administrador.
		exit;
	}

	public static function limit_public_users( array $args, $resolver ) {
		if ( ! is_user_logged_in() && $resolver instanceof \WPGraphQL\Data\Connection\UserConnectionResolver ) {
			$args['include'] = array( 0 );
		}
		return $args;
	}
}
