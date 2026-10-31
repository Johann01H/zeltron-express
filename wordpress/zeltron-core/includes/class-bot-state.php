<?php
namespace Zeltron\Core;

use GraphQL\Error\UserError;

defined( 'ABSPATH' ) || exit;

/**
 * Memoria corta del bot de WhatsApp (vive en el servidor de Next.js, que no guarda estado entre peticiones).
 * Por cada número se guarda un JSON pequeño (paso de la conversación, mensajes ya procesados,
 * pausa cuando atiende una persona) durante 24 horas. Solo con X-Zeltron-Secret.
 */
final class Bot_State {

	private const TTL       = DAY_IN_SECONDS;
	private const MAX_BYTES = 8000;

	public static function init(): void {
		add_action( 'graphql_register_types', array( self::class, 'register' ) );
	}

	private static function key( string $phone ): string {
		$digits = preg_replace( '/\D/', '', $phone );
		if ( strlen( $digits ) < 7 || strlen( $digits ) > 15 ) {
			throw new UserError( 'Número no válido.' );
		}
		return 'zx_bot_' . substr( hash_hmac( 'sha256', $digits, wp_salt( 'auth' ) ), 0, 32 );
	}

	public static function register(): void {
		register_graphql_field(
			'RootQuery',
			'zeltronBotState',
			array(
				'type'    => 'String',
				'args'    => array( 'phone' => array( 'type' => array( 'non_null' => 'String' ) ) ),
				'resolve' => static function ( $root, array $args ) {
					Customer_Accounts::require_secret();
					$value = get_transient( self::key( (string) $args['phone'] ) );
					return is_string( $value ) ? $value : null;
				},
			)
		);

		register_graphql_mutation(
			'zeltronSetBotState',
			array(
				'inputFields'         => array(
					'phone' => array( 'type' => array( 'non_null' => 'String' ) ),
					'state' => array( 'type' => array( 'non_null' => 'String' ), 'description' => 'JSON; vacío para borrar.' ),
				),
				'outputFields'        => array( 'ok' => array( 'type' => 'Boolean' ) ),
				'mutateAndGetPayload' => static function ( array $input ) {
					Customer_Accounts::require_secret();
					$key   = self::key( (string) $input['phone'] );
					$state = (string) $input['state'];
					if ( '' === $state ) {
						delete_transient( $key );
						return array( 'ok' => true );
					}
					if ( strlen( $state ) > self::MAX_BYTES || null === json_decode( $state ) ) {
						throw new UserError( 'Estado no válido.' );
					}
					set_transient( $key, $state, self::TTL );
					return array( 'ok' => true );
				},
			)
		);
	}
}
