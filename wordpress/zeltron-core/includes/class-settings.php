<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Ajustes de la tienda: WooCommerce → Zeltron.
 * El secreto de la API puede definirse en wp-config.php con ZELTRON_API_SECRET (recomendado).
 */
final class Settings {

	public const OPTION = 'zeltron_core_settings';

	public static function defaults(): array {
		return array(
			'frontend_url'       => 'https://zeltronexpress.com',
			'api_secret'         => '',
			'whatsapp_number'    => '573025931994',
			'shipping_fee'       => 12000,
			'free_shipping_from' => 150000,
			'express_cities'     => 'Cali, Jamundí, Yumbo, Palmira, Candelaria',
			'express_department' => 'Valle del Cauca',
			'redirect_frontend'  => 1,
		);
	}

	public static function init(): void {
		add_action( 'admin_menu', array( self::class, 'menu' ), 60 );
		add_action( 'admin_init', array( self::class, 'register' ) );
	}

	public static function on_activate(): void {
		$current = get_option( self::OPTION, array() );
		$merged  = wp_parse_args( is_array( $current ) ? $current : array(), self::defaults() );
		if ( empty( $merged['api_secret'] ) ) {
			$merged['api_secret'] = bin2hex( random_bytes( 32 ) );
		}
		update_option( self::OPTION, $merged, false );
	}

	public static function all(): array {
		$saved = get_option( self::OPTION, array() );
		return wp_parse_args( is_array( $saved ) ? $saved : array(), self::defaults() );
	}

	public static function get( string $key ) {
		$all = self::all();
		return $all[ $key ] ?? null;
	}

	public static function api_secret(): string {
		if ( defined( 'ZELTRON_API_SECRET' ) && ZELTRON_API_SECRET ) {
			return (string) ZELTRON_API_SECRET;
		}
		return (string) self::get( 'api_secret' );
	}

	public static function frontend_url(): string {
		return untrailingslashit( (string) self::get( 'frontend_url' ) );
	}

	/** @return string[] */
	public static function express_cities(): array {
		return array_values( array_filter( array_map( 'trim', explode( ',', (string) self::get( 'express_cities' ) ) ) ) );
	}

	/** Verifica el encabezado X-Zeltron-Secret de una petición servidor a servidor. */
	public static function request_is_authorized(): bool {
		$secret = self::api_secret();
		$sent   = isset( $_SERVER['HTTP_X_ZELTRON_SECRET'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_ZELTRON_SECRET'] ) ) : '';
		return '' !== $secret && '' !== $sent && hash_equals( $secret, $sent );
	}

	public static function menu(): void {
		add_submenu_page(
			'woocommerce',
			'Zeltron',
			'Zeltron',
			'manage_woocommerce',
			'zeltron-core',
			array( self::class, 'render' )
		);
	}

	public static function register(): void {
		register_setting(
			'zeltron_core',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( self::class, 'sanitize' ),
			)
		);
	}

	public static function sanitize( $input ): array {
		$current = self::all();
		$input   = is_array( $input ) ? $input : array();
		$out     = $current;

		$out['frontend_url']       = esc_url_raw( $input['frontend_url'] ?? $current['frontend_url'] );
		$out['whatsapp_number']    = preg_replace( '/\D/', '', (string) ( $input['whatsapp_number'] ?? $current['whatsapp_number'] ) );
		$out['shipping_fee']       = max( 0, absint( $input['shipping_fee'] ?? $current['shipping_fee'] ) );
		$out['free_shipping_from'] = max( 0, absint( $input['free_shipping_from'] ?? $current['free_shipping_from'] ) );
		$out['express_cities']     = sanitize_text_field( $input['express_cities'] ?? $current['express_cities'] );
		$out['express_department'] = sanitize_text_field( $input['express_department'] ?? $current['express_department'] );
		$out['redirect_frontend']  = empty( $input['redirect_frontend'] ) ? 0 : 1;

		if ( ! empty( $input['regenerate_secret'] ) ) {
			$out['api_secret'] = bin2hex( random_bytes( 32 ) );
			add_settings_error( self::OPTION, 'secret', 'Se generó un secreto nuevo. Actualiza ZELTRON_API_SECRET en Vercel.', 'updated' );
		}
		return $out;
	}

	public static function render(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		$s            = self::all();
		$from_config  = defined( 'ZELTRON_API_SECRET' ) && ZELTRON_API_SECRET;
		$graphql_url  = function_exists( 'graphql_get_endpoint_url' ) ? graphql_get_endpoint_url() : home_url( '/graphql' );
		$name         = self::OPTION;
		?>
		<div class="wrap">
			<h1>Zeltron Express</h1>
			<p>Conexión entre WordPress (panel y API) y la tienda en Next.js.</p>
			<?php settings_errors( self::OPTION ); ?>

			<h2>Conexión con el frontend</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">Endpoint GraphQL</th>
					<td><code><?php echo esc_html( $graphql_url ); ?></code><p class="description">Valor de <code>WORDPRESS_GRAPHQL_URL</code> en Vercel.</p></td>
				</tr>
				<tr>
					<th scope="row">Secreto de la API</th>
					<td>
						<?php if ( $from_config ) : ?>
							<p>Definido en <code>wp-config.php</code> (ZELTRON_API_SECRET).</p>
						<?php else : ?>
							<input type="text" class="large-text code" readonly value="<?php echo esc_attr( $s['api_secret'] ); ?>" onclick="this.select()">
							<p class="description">Copia este valor en <code>ZELTRON_API_SECRET</code> en Vercel. Es el mismo en ambos lados.</p>
						<?php endif; ?>
					</td>
				</tr>
			</table>

			<form method="post" action="options.php">
				<?php settings_fields( 'zeltron_core' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="zx-frontend">URL de la tienda</label></th>
						<td><input id="zx-frontend" name="<?php echo esc_attr( $name ); ?>[frontend_url]" type="url" class="regular-text" value="<?php echo esc_attr( $s['frontend_url'] ); ?>">
						<p class="description">Se usa para avisar a la tienda cuando cambian los productos y para redirigir visitas.</p></td>
					</tr>
					<tr>
						<th scope="row"><label for="zx-wa">WhatsApp</label></th>
						<td><input id="zx-wa" name="<?php echo esc_attr( $name ); ?>[whatsapp_number]" type="text" class="regular-text" value="<?php echo esc_attr( $s['whatsapp_number'] ); ?>">
						<p class="description">Con indicativo, sin espacios. Ej. 573025931994</p></td>
					</tr>
					<tr>
						<th scope="row"><label for="zx-fee">Costo de envío (COP)</label></th>
						<td><input id="zx-fee" name="<?php echo esc_attr( $name ); ?>[shipping_fee]" type="number" min="0" step="100" value="<?php echo esc_attr( $s['shipping_fee'] ); ?>"></td>
					</tr>
					<tr>
						<th scope="row"><label for="zx-free">Envío gratis desde (COP)</label></th>
						<td><input id="zx-free" name="<?php echo esc_attr( $name ); ?>[free_shipping_from]" type="number" min="0" step="1000" value="<?php echo esc_attr( $s['free_shipping_from'] ); ?>"></td>
					</tr>
					<tr>
						<th scope="row"><label for="zx-cities">Ciudades con entrega exprés</label></th>
						<td><input id="zx-cities" name="<?php echo esc_attr( $name ); ?>[express_cities]" type="text" class="large-text" value="<?php echo esc_attr( $s['express_cities'] ); ?>">
						<p class="description">Separadas por comas. Departamento: <input name="<?php echo esc_attr( $name ); ?>[express_department]" type="text" value="<?php echo esc_attr( $s['express_department'] ); ?>"></p></td>
					</tr>
					<tr>
						<th scope="row">Sitio público de WordPress</th>
						<td><label><input name="<?php echo esc_attr( $name ); ?>[redirect_frontend]" type="checkbox" value="1" <?php checked( $s['redirect_frontend'], 1 ); ?>> Redirigir las visitas públicas a la tienda</label>
						<p class="description">WordPress solo funciona como panel. El panel, la API y el login no se redirigen.</p></td>
					</tr>
					<?php if ( ! $from_config ) : ?>
					<tr>
						<th scope="row">Secreto</th>
						<td><label><input name="<?php echo esc_attr( $name ); ?>[regenerate_secret]" type="checkbox" value="1"> Generar un secreto nuevo al guardar</label></td>
					</tr>
					<?php endif; ?>
				</table>
				<?php submit_button( 'Guardar ajustes' ); ?>
			</form>

			<?php Image_Linker::render_box(); ?>
		</div>
		<?php
	}
}
