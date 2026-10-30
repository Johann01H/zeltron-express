<?php
/**
 * Al desinstalar se borran solo los ajustes del plugin.
 * Los pedidos y los datos de proveedor de los productos se conservan.
 */
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'zeltron_core_settings' );
