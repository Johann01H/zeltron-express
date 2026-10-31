<?php
namespace Zeltron\Core;

use GraphQL\Error\UserError;

defined( 'ABSPATH' ) || exit;

/**
 * Cuentas de cliente para la tienda headless.
 *
 * - Las cuentas son clientes de WooCommerce (rol «customer»).
 * - Next.js nunca recibe la contraseña de vuelta ni una cookie de WordPress: recibe un
 *   token de sesión aleatorio que guarda en una cookie httpOnly. Aquí solo se guarda su hash.
 * - Todas las operaciones exigen X-Zeltron-Secret (solo las llama el servidor de Next.js).
 * - La recuperación de contraseña envía un correo con un enlace a la tienda
 *   ({frontend}/restablecer-contrasena) usando la clave nativa de WordPress (caduca en 24 h).
 */
final class Customer_Accounts {

	private const SESSIONS_META   = '_zx_sessions';
	private const MAX_SESSIONS    = 10;
	private const SHORT_SESSION   = DAY_IN_SECONDS;
	private const LONG_SESSION    = 30 * DAY_IN_SECONDS;
	private const MAX_FAILED      = 5;
	private const LOCK_WINDOW     = 15 * MINUTE_IN_SECONDS;
	private const MAX_RESET_MAILS = 3;
	private const MIN_PASSWORD    = 8;

	public static function init(): void {
		add_action( 'graphql_register_types', array( self::class, 'register' ) );
	}

	/* ---------------------------------------------------------------------
	 * Operaciones
	 * ------------------------------------------------------------------- */

	public static function sign_up( array $input ): array {
		$email    = sanitize_email( (string) ( $input['email'] ?? '' ) );
		$name     = self::clean_text( (string) ( $input['name'] ?? '' ), 80 );
		$phone    = preg_replace( '/[^\d+]/', '', (string) ( $input['phone'] ?? '' ) );
		$password = (string) ( $input['password'] ?? '' );

		if ( '' === $name ) {
			throw new UserError( 'Escribe tu nombre.' );
		}
		if ( ! is_email( $email ) ) {
			throw new UserError( 'Escribe un correo electrónico válido.' );
		}
		self::assert_password( $password );
		if ( email_exists( $email ) ) {
			throw new UserError( 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.' );
		}

		$parts = preg_split( '/\s+/', $name, 2 );
		// Sin correo de bienvenida de WooCommerce con la contraseña: el cliente ya la conoce.
		add_filter( 'woocommerce_email_enabled_customer_new_account', '__return_false' );
		$user_id = wc_create_new_customer(
			$email,
			'',
			$password,
			array(
				'first_name' => $parts[0] ?? '',
				'last_name'  => $parts[1] ?? '',
			)
		);
		remove_filter( 'woocommerce_email_enabled_customer_new_account', '__return_false' );

		if ( is_wp_error( $user_id ) ) {
			throw new UserError( esc_html( wp_strip_all_tags( $user_id->get_error_message() ) ) );
		}

		$customer = new \WC_Customer( $user_id );
		$customer->set_billing_first_name( $parts[0] ?? '' );
		$customer->set_billing_last_name( $parts[1] ?? '' );
		$customer->set_billing_email( $email );
		if ( '' !== $phone ) {
			$customer->set_billing_phone( $phone );
		}
		$customer->save();

		$session = self::issue_session( (int) $user_id, false );
		return array(
			'token'     => $session['token'],
			'expiresIn' => $session['expires_in'],
			'customer'  => self::profile( (int) $user_id ),
		);
	}

	public static function sign_in( array $input ): array {
		$email    = sanitize_email( (string) ( $input['email'] ?? '' ) );
		$password = (string) ( $input['password'] ?? '' );
		$remember = ! empty( $input['remember'] );

		if ( '' === $email || '' === $password ) {
			throw new UserError( 'Escribe tu correo y tu contraseña.' );
		}

		$lock_key = 'zx_login_' . md5( strtolower( $email ) );
		$failed   = (int) get_transient( $lock_key );
		if ( $failed >= self::MAX_FAILED ) {
			throw new UserError( 'Demasiados intentos. Espera 15 minutos o recupera tu contraseña.' );
		}

		$user = get_user_by( 'email', $email );
		if ( ! $user || ! wp_check_password( $password, $user->user_pass, $user->ID ) ) {
			set_transient( $lock_key, $failed + 1, self::LOCK_WINDOW );
			throw new UserError( 'El correo o la contraseña no son correctos.' );
		}

		delete_transient( $lock_key );
		$session = self::issue_session( (int) $user->ID, $remember );
		return array(
			'token'     => $session['token'],
			'expiresIn' => $session['expires_in'],
			'customer'  => self::profile( (int) $user->ID ),
		);
	}

	public static function sign_out( string $token ): bool {
		$user_id = self::user_for_token( $token );
		if ( $user_id ) {
			$sessions = self::sessions( $user_id );
			unset( $sessions[ self::hash( $token ) ] );
			update_user_meta( $user_id, self::SESSIONS_META, $sessions );
		}
		return true;
	}

	/** Siempre responde igual, exista o no la cuenta, para no revelar qué correos están registrados. */
	public static function request_password_reset( string $email ): bool {
		$email = sanitize_email( $email );
		$user  = is_email( $email ) ? get_user_by( 'email', $email ) : false;
		if ( ! $user ) {
			return true;
		}

		$limit_key = 'zx_reset_' . md5( strtolower( $email ) );
		$sent      = (int) get_transient( $limit_key );
		if ( $sent >= self::MAX_RESET_MAILS ) {
			return true;
		}

		$key = get_password_reset_key( $user );
		if ( is_wp_error( $key ) ) {
			return true;
		}

		$link = add_query_arg(
			array(
				'key'   => rawurlencode( $key ),
				'login' => rawurlencode( $user->user_login ),
			),
			Settings::frontend_url() . '/restablecer-contrasena'
		);

		$sent_ok = self::send_reset_email( $user, $link );
		if ( $sent_ok ) {
			set_transient( $limit_key, $sent + 1, HOUR_IN_SECONDS );
		}
		return true;
	}

	public static function reset_password( array $input ): bool {
		$login    = sanitize_user( rawurldecode( (string) ( $input['login'] ?? '' ) ) );
		$key      = rawurldecode( (string) ( $input['key'] ?? '' ) );
		$password = (string) ( $input['password'] ?? '' );

		$user = check_password_reset_key( $key, $login );
		if ( is_wp_error( $user ) ) {
			throw new UserError( 'El enlace no es válido o ya caducó. Solicita uno nuevo.' );
		}
		self::assert_password( $password );

		reset_password( $user, $password );
		// Cierra todas las sesiones abiertas con la contraseña anterior.
		delete_user_meta( $user->ID, self::SESSIONS_META );
		return true;
	}

	/* ---------------------------------------------------------------------
	 * Sesiones
	 * ------------------------------------------------------------------- */

	private static function issue_session( int $user_id, bool $remember ): array {
		$token    = bin2hex( random_bytes( 32 ) );
		$ttl      = $remember ? self::LONG_SESSION : self::SHORT_SESSION;
		$sessions = self::sessions( $user_id );

		$sessions[ self::hash( $token ) ] = time() + $ttl;
		arsort( $sessions );
		$sessions = array_slice( $sessions, 0, self::MAX_SESSIONS, true );
		update_user_meta( $user_id, self::SESSIONS_META, $sessions );

		return array( 'token' => $token, 'expires_in' => $ttl );
	}

	/** @return array<string,int> hash => expira */
	public static function sessions( int $user_id ): array {
		$sessions = get_user_meta( $user_id, self::SESSIONS_META, true );
		$sessions = is_array( $sessions ) ? $sessions : array();
		$now      = time();
		return array_filter( $sessions, static fn( $expires ) => (int) $expires > $now );
	}

	public static function user_for_token( string $token ): int {
		if ( ! preg_match( '/^[a-f0-9]{64}$/', $token ) ) {
			return 0;
		}
		$hash  = self::hash( $token );
		$users = get_users(
			array(
				'meta_key'     => self::SESSIONS_META,
				'meta_compare' => 'LIKE',
				'meta_value'   => $hash,
				'fields'       => 'ID',
				'number'       => 1,
			)
		);
		if ( empty( $users ) ) {
			return 0;
		}
		$user_id  = (int) $users[0];
		$sessions = self::sessions( $user_id );
		return isset( $sessions[ $hash ] ) ? $user_id : 0;
	}

	/** Cierra todas las sesiones menos la indicada (por ejemplo, tras cambiar la contraseña). */
	public static function keep_only_session( int $user_id, string $token ): void {
		$sessions = self::sessions( $user_id );
		$hash     = self::hash( $token );
		update_user_meta( $user_id, self::SESSIONS_META, isset( $sessions[ $hash ] ) ? array( $hash => $sessions[ $hash ] ) : array() );
	}

	public static function hash( string $token ): string {
		return hash_hmac( 'sha256', $token, wp_salt( 'auth' ) );
	}

	/** Perfil completo (ver Customer_Profile). */
	public static function profile( int $user_id ): array {
		return Customer_Profile::data( $user_id );
	}

	/* ---------------------------------------------------------------------
	 * Correo de recuperación
	 * ------------------------------------------------------------------- */

	private static function send_reset_email( \WP_User $user, string $link ): bool {
		$first   = get_user_meta( $user->ID, 'first_name', true ) ?: $user->display_name;
		$store   = 'ZELTRON Express';
		$subject = 'Restablece tu contraseña de ' . $store;
		$wa      = (string) Settings::get( 'whatsapp_number' );

		$html = '<!doctype html><html lang="es"><body style="margin:0;background:#F3F5FA;font-family:Arial,Helvetica,sans-serif;color:#0E1A3A">'
			. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5FA;padding:32px 12px"><tr><td align="center">'
			. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #DCE1EC">'
			. '<tr><td style="background:#0E1A3A;padding:22px 28px;font-size:20px;font-weight:800;letter-spacing:-.5px;color:#ffffff">ZELTRON <span style="color:#FFC92E">Express</span></td></tr>'
			. '<tr><td style="padding:30px 28px 8px">'
			. '<h1 style="margin:0 0 12px;font-size:22px;line-height:1.25">Hola, ' . esc_html( $first ) . '</h1>'
			. '<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5B6478">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón para crear una nueva. El enlace funciona durante 24 horas.</p>'
			. '<p style="margin:0 0 24px"><a href="' . esc_url( $link ) . '" style="display:inline-block;background:#0E1A3A;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:12px">Crear nueva contraseña</a></p>'
			. '<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#5B6478">Si el botón no funciona, copia este enlace en tu navegador:</p>'
			. '<p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all"><a href="' . esc_url( $link ) . '" style="color:#2F5BFF">' . esc_html( $link ) . '</a></p>'
			. '<p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#5B6478">Si no pediste este cambio, ignora este correo: tu contraseña sigue igual.</p>'
			. '</td></tr>'
			. '<tr><td style="padding:18px 28px;border-top:1px solid #E6EAF2;font-size:12px;color:#8A8C95">¿Necesitas ayuda? Escríbenos por WhatsApp' . ( $wa ? ' al +' . esc_html( $wa ) : '' ) . '.</td></tr>'
			. '</table></td></tr></table></body></html>';

		$from_name = static fn() => $store;
		add_filter( 'wp_mail_from_name', $from_name );
		$sent = wp_mail( $user->user_email, $subject, $html, array( 'Content-Type: text/html; charset=UTF-8' ) );
		remove_filter( 'wp_mail_from_name', $from_name );
		return (bool) $sent;
	}

	/* ---------------------------------------------------------------------
	 * Utilidades
	 * ------------------------------------------------------------------- */

	public static function assert_password( string $password ): void {
		if ( strlen( $password ) < self::MIN_PASSWORD ) {
			throw new UserError( 'La contraseña debe tener al menos 8 caracteres.' );
		}
		if ( strlen( $password ) > 200 ) {
			throw new UserError( 'La contraseña es demasiado larga.' );
		}
	}

	public static function clean_text( string $value, int $max ): string {
		return mb_substr( trim( preg_replace( '/\s+/', ' ', sanitize_text_field( $value ) ) ), 0, $max );
	}

	public static function require_secret(): void {
		if ( ! Settings::request_is_authorized() ) {
			throw new UserError( 'No autorizado.' );
		}
	}

	/* ---------------------------------------------------------------------
	 * GraphQL
	 * ------------------------------------------------------------------- */

	public static function register(): void {
		$session_output = array(
			'token'     => array( 'type' => 'String' ),
			'expiresIn' => array( 'type' => 'Int', 'description' => 'Segundos de vida de la sesión.' ),
			'customer'  => array( 'type' => 'ZeltronCustomer' ),
		);

		register_graphql_field(
			'RootQuery',
			'zeltronCustomer',
			array(
				'type'        => 'ZeltronCustomer',
				'description' => 'Cliente dueño del token de sesión. Requiere X-Zeltron-Secret.',
				'args'        => array( 'token' => array( 'type' => array( 'non_null' => 'String' ) ) ),
				'resolve'     => static function ( $root, array $args ) {
					self::require_secret();
					$user_id = self::user_for_token( (string) $args['token'] );
					return $user_id ? self::profile( $user_id ) : null;
				},
			)
		);

		register_graphql_mutation(
			'zeltronSignUp',
			array(
				'inputFields'         => array(
					'name'     => array( 'type' => array( 'non_null' => 'String' ) ),
					'email'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'phone'    => array( 'type' => 'String' ),
					'password' => array( 'type' => array( 'non_null' => 'String' ) ),
				),
				'outputFields'        => $session_output,
				'mutateAndGetPayload' => static function ( array $input ) {
					self::require_secret();
					return self::sign_up( $input );
				},
			)
		);

		register_graphql_mutation(
			'zeltronSignIn',
			array(
				'inputFields'         => array(
					'email'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'password' => array( 'type' => array( 'non_null' => 'String' ) ),
					'remember' => array( 'type' => 'Boolean' ),
				),
				'outputFields'        => $session_output,
				'mutateAndGetPayload' => static function ( array $input ) {
					self::require_secret();
					return self::sign_in( $input );
				},
			)
		);

		register_graphql_mutation(
			'zeltronSignOut',
			array(
				'inputFields'         => array( 'token' => array( 'type' => array( 'non_null' => 'String' ) ) ),
				'outputFields'        => array( 'ok' => array( 'type' => 'Boolean' ) ),
				'mutateAndGetPayload' => static function ( array $input ) {
					self::require_secret();
					return array( 'ok' => self::sign_out( (string) $input['token'] ) );
				},
			)
		);

		register_graphql_mutation(
			'zeltronRequestPasswordReset',
			array(
				'inputFields'         => array( 'email' => array( 'type' => array( 'non_null' => 'String' ) ) ),
				'outputFields'        => array( 'ok' => array( 'type' => 'Boolean' ) ),
				'mutateAndGetPayload' => static function ( array $input ) {
					self::require_secret();
					return array( 'ok' => self::request_password_reset( (string) $input['email'] ) );
				},
			)
		);

		register_graphql_mutation(
			'zeltronResetPassword',
			array(
				'inputFields'         => array(
					'login'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'key'      => array( 'type' => array( 'non_null' => 'String' ) ),
					'password' => array( 'type' => array( 'non_null' => 'String' ) ),
				),
				'outputFields'        => array( 'ok' => array( 'type' => 'Boolean' ) ),
				'mutateAndGetPayload' => static function ( array $input ) {
					self::require_secret();
					return array( 'ok' => self::reset_password( $input ) );
				},
			)
		);
	}
}
