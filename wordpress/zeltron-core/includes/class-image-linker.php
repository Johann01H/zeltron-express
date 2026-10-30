<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Asigna a cada producto la imagen de Medios cuyo archivo se llama igual que su referencia (SKU).
 * Ej.: el producto con SKU CON-NSW2 recibe la imagen CON-NSW2.jpg.
 * Se ejecuta desde WooCommerce → Zeltron → «Asignar imágenes por referencia».
 */
final class Image_Linker {

	public const ACTION = 'zeltron_link_images';

	public static function init(): void {
		add_action( 'admin_post_' . self::ACTION, array( self::class, 'handle' ) );
	}

	public static function handle(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'No tienes permiso para hacer esto.' );
		}
		check_admin_referer( self::ACTION );

		$overwrite = ! empty( $_POST['overwrite'] );
		$result    = self::run( $overwrite );

		set_transient( 'zeltron_link_images_result_' . get_current_user_id(), $result, 10 * MINUTE_IN_SECONDS );
		wp_safe_redirect( admin_url( 'admin.php?page=zeltron-core&zx_images=1' ) );
		exit;
	}

	/**
	 * @return array{linked:int,kept:int,missing:string[]}
	 */
	public static function run( bool $overwrite = false ): array {
		$index  = self::attachment_index();
		$result = array( 'linked' => 0, 'kept' => 0, 'missing' => array() );

		$ids = wc_get_products( array( 'limit' => -1, 'status' => array( 'publish', 'draft', 'pending', 'private' ), 'type' => array( 'simple', 'variable' ), 'return' => 'ids' ) );
		foreach ( $ids as $id ) {
			$product = wc_get_product( $id );
			if ( ! $product ) {
				continue;
			}
			$sku = strtolower( trim( (string) $product->get_sku() ) );
			if ( '' === $sku ) {
				continue;
			}
			if ( ! $overwrite && $product->get_image_id() ) {
				$result['kept']++;
				continue;
			}
			if ( empty( $index[ $sku ] ) ) {
				$result['missing'][] = $product->get_sku();
				continue;
			}
			$product->set_image_id( $index[ $sku ] );
			$product->save();
			$result['linked']++;
		}
		Catalog::flush();
		return $result;
	}

	/**
	 * Mapa «nombre de archivo sin extensión» → ID del adjunto.
	 * Si WordPress renombró un duplicado (CON-NSW2-1.jpg) se usa solo cuando no existe el original.
	 *
	 * @return array<string,int>
	 */
	private static function attachment_index(): array {
		global $wpdb;
		$rows  = $wpdb->get_results(
			"SELECT p.ID, m.meta_value AS file FROM {$wpdb->posts} p
			 JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_wp_attached_file'
			 WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%'
			 ORDER BY p.ID ASC"
		);
		$exact = array();
		$dupes = array();
		foreach ( $rows as $row ) {
			$name = strtolower( pathinfo( (string) $row->file, PATHINFO_FILENAME ) );
			$name = preg_replace( '/-scaled$/', '', $name );
			if ( preg_match( '/^(.*)-\d+$/', $name, $m ) ) {
				$dupes[ $m[1] ] = $dupes[ $m[1] ] ?? (int) $row->ID;
			}
			$exact[ $name ] = $exact[ $name ] ?? (int) $row->ID;
		}
		return $exact + $dupes;
	}

	public static function render_box(): void {
		$key    = 'zeltron_link_images_result_' . get_current_user_id();
		$result = isset( $_GET['zx_images'] ) ? get_transient( $key ) : false;
		if ( $result ) {
			delete_transient( $key );
			$missing = count( $result['missing'] );
			echo '<div class="notice notice-success"><p><strong>Imágenes asignadas: ' . esc_html( (string) $result['linked'] ) . '.</strong> ';
			echo 'Ya tenían imagen: ' . esc_html( (string) $result['kept'] ) . '. Sin imagen en Medios: ' . esc_html( (string) $missing ) . '.</p>';
			if ( $missing ) {
				echo '<p>Faltan: <code>' . esc_html( implode( ', ', array_slice( $result['missing'], 0, 40 ) ) ) . '</code></p>';
			}
			echo '</div>';
		}
		?>
		<h2>Imágenes de productos</h2>
		<p>Asigna a cada producto la imagen de <a href="<?php echo esc_url( admin_url( 'upload.php' ) ); ?>">Medios</a> que se llama igual que su referencia (por ejemplo <code>CON-NSW2.jpg</code> → producto con SKU <code>CON-NSW2</code>).</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="<?php echo esc_attr( self::ACTION ); ?>">
			<?php wp_nonce_field( self::ACTION ); ?>
			<label><input type="checkbox" name="overwrite" value="1"> Reemplazar también la imagen de los productos que ya tienen una</label>
			<?php submit_button( 'Asignar imágenes por referencia', 'secondary' ); ?>
		</form>
		<?php
	}
}
