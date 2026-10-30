<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Reglas de envío. Son la fuente de verdad: el frontend solo las muestra.
 */
final class Shipping {

	public static function normalize( string $value ): string {
		return strtolower( trim( remove_accents( $value ) ) );
	}

	/** @return 'express'|'national' */
	public static function zone_for( string $city, string $department ): string {
		$express_department = self::normalize( (string) Settings::get( 'express_department' ) );
		if ( '' !== $department && self::normalize( $department ) !== $express_department ) {
			return 'national';
		}
		$city = self::normalize( $city );
		foreach ( Settings::express_cities() as $express ) {
			if ( self::normalize( $express ) === $city ) {
				return 'express';
			}
		}
		return 'national';
	}

	public static function zone_label( string $zone ): string {
		return 'express' === $zone ? 'Entrega exprés Cali' : 'Envío nacional';
	}

	public static function fee_for( float $subtotal ): float {
		$free_from = (float) Settings::get( 'free_shipping_from' );
		if ( $subtotal <= 0 || ( $free_from > 0 && $subtotal >= $free_from ) ) {
			return 0.0;
		}
		return (float) Settings::get( 'shipping_fee' );
	}

	/** Código de departamento de WooCommerce (ej. "CO-VAC") a partir del nombre que envía el frontend. */
	public static function state_code( string $department ): string {
		$target = self::normalize( $department );
		$aliases = array(
			'bogota d.c.'              => 'CO-DC',
			'bogota'                   => 'CO-DC',
			'san andres y providencia' => 'CO-SAP',
		);
		if ( isset( $aliases[ $target ] ) ) {
			return $aliases[ $target ];
		}
		$states = WC()->countries->get_states( 'CO' );
		foreach ( is_array( $states ) ? $states : array() as $code => $name ) {
			if ( self::normalize( (string) $name ) === $target ) {
				return (string) $code;
			}
		}
		return '';
	}
}
