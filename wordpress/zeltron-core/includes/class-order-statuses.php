<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Estados propios del flujo contra entrega:
 * Por confirmar → Confirmado → Despachado → Completado (entregado) | Devuelto | Cancelado
 */
final class Order_Statuses {

	public const PENDING_CONFIRMATION = 'zx-por-confirmar';
	public const CONFIRMED            = 'zx-confirmado';
	public const SHIPPED              = 'zx-despachado';
	public const RETURNED             = 'zx-devuelto';

	public static function labels(): array {
		return array(
			'wc-' . self::PENDING_CONFIRMATION => 'Por confirmar',
			'wc-' . self::CONFIRMED            => 'Confirmado',
			'wc-' . self::SHIPPED              => 'Despachado',
			'wc-' . self::RETURNED             => 'Devuelto',
		);
	}

	public static function init(): void {
		add_action( 'init', array( self::class, 'register' ) );
		add_filter( 'wc_order_statuses', array( self::class, 'add_to_list' ) );
		add_filter( 'woocommerce_register_shop_order_post_statuses', array( self::class, 'register_with_wc' ) );
		// Los pedidos en estos estados cuentan como ventas en reportes y se pueden editar.
		add_filter( 'woocommerce_reports_order_statuses', array( self::class, 'report_statuses' ) );
		add_filter( 'woocommerce_order_is_paid_statuses', array( self::class, 'not_paid' ) );
		add_filter( 'wc_order_is_editable', array( self::class, 'editable' ), 10, 2 );
	}

	public static function register(): void {
		foreach ( self::labels() as $status => $label ) {
			register_post_status(
				$status,
				array(
					'label'                     => $label,
					'public'                    => false,
					'exclude_from_search'       => false,
					'show_in_admin_all_list'    => true,
					'show_in_admin_status_list' => true,
					/* translators: %s: number of orders */
					'label_count'               => _n_noop( $label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>', 'zeltron-core' ),
				)
			);
		}
	}

	public static function register_with_wc( array $statuses ): array {
		foreach ( self::labels() as $status => $label ) {
			$statuses[ $status ] = array(
				'label'                     => $label,
				'public'                    => false,
				'exclude_from_search'       => false,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				'label_count'               => _n_noop( $label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>', 'zeltron-core' ),
			);
		}
		return $statuses;
	}

	public static function add_to_list( array $statuses ): array {
		if ( ! isset( $statuses['wc-pending'] ) ) {
			return array_merge( $statuses, self::labels() );
		}
		$out = array();
		foreach ( $statuses as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'wc-pending' === $key ) {
				// Los estados propios van justo después de "Pendiente de pago".
				$out = array_merge( $out, self::labels() );
			}
		}
		return $out;
	}

	public static function report_statuses( $statuses ) {
		if ( is_array( $statuses ) ) {
			$statuses[] = self::CONFIRMED;
			$statuses[] = self::SHIPPED;
		}
		return $statuses;
	}

	/** El contra entrega no está pagado hasta que se entrega (estado Completado). */
	public static function not_paid( array $statuses ): array {
		return array_values( array_diff( $statuses, array( self::PENDING_CONFIRMATION, self::CONFIRMED, self::SHIPPED ) ) );
	}

	public static function editable( bool $editable, $order ): bool {
		if ( $order instanceof \WC_Order && in_array( $order->get_status(), array( self::PENDING_CONFIRMATION, self::CONFIRMED ), true ) ) {
			return true;
		}
		return $editable;
	}

	/** Paso de la línea de tiempo del frontend para cada estado. */
	public static function timeline_step( string $status ): string {
		switch ( $status ) {
			case self::PENDING_CONFIRMATION:
			case 'pending':
			case 'on-hold':
				return 'confirmacion';
			case self::CONFIRMED:
			case 'processing':
				return 'despachado';
			case self::SHIPPED:
				return 'en-camino';
			case 'completed':
				return 'entregado';
			default:
				return 'cancelado';
		}
	}
}
