<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Financieras para comprar a crédito (Addi, Sistecrédito, PayJoy…).
 *
 * Menú «Financieras»: logo oficial (imagen destacada), para quién es
 * (buen historial / reportados / ambos), cómo se solicita (enlace en línea o
 * asesor por WhatsApp) y una frase corta. El sitio las muestra en el footer,
 * en /credito y en la página de cada producto (consulta `zeltronFinanciers`).
 */
final class Financiers {

	public const POST_TYPE = 'zx_financier';

	public const AUDIENCES = array(
		'good'     => 'Buen historial crediticio',
		'reported' => 'Personas reportadas',
		'both'     => 'Ambos',
	);

	/** Financieras con convenio, para crearlas de un clic (las frases se pueden editar). */
	private const STARTER = array(
		array( 'Sistecrédito', 'good', 'Crédito rápido con tu cédula.' ),
		array( 'Brilla', 'good', 'Financia con tu factura del gas natural.' ),
		array( 'Banco de Bogotá', 'good', 'Financia con tu crédito o tarjeta del banco.' ),
		array( 'Addi', 'good', 'Paga a cuotas, aprobación en minutos.' ),
		array( 'SUMAS', 'good', 'Compra hoy y paga a cuotas.' ),
		array( 'PayJoy', 'reported', 'Celular a crédito, aunque estés reportado.' ),
		array( 'Alo Credit', 'reported', 'Opción de crédito para reportados.' ),
		array( 'KrediYA', 'reported', 'Opción de crédito para reportados.' ),
	);

	public static function init(): void {
		add_action( 'init', array( self::class, 'register' ) );
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( self::class, 'save' ) );
		add_filter( 'use_block_editor_for_post_type', array( self::class, 'classic_editor' ), 10, 2 );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( self::class, 'columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( self::class, 'column' ), 10, 2 );
		add_action( 'admin_notices', array( self::class, 'starter_notice' ) );
		add_action( 'admin_post_zeltron_seed_financiers', array( self::class, 'seed' ) );
		add_action( 'graphql_register_types', array( self::class, 'register_graphql' ) );
	}

	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'          => array(
					'name'                  => 'Financieras',
					'singular_name'         => 'Financiera',
					'menu_name'             => 'Financieras',
					'add_new'               => 'Nueva financiera',
					'add_new_item'          => 'Nueva financiera',
					'edit_item'             => 'Editar financiera',
					'search_items'          => 'Buscar financieras',
					'not_found'             => 'Aún no hay financieras.',
					'all_items'             => 'Todas las financieras',
					'featured_image'        => 'Logo oficial',
					'set_featured_image'    => 'Subir logo',
					'remove_featured_image' => 'Quitar logo',
					'use_featured_image'    => 'Usar como logo',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_position'   => 58,
				'menu_icon'       => 'dashicons-money-alt',
				'supports'        => array( 'title', 'thumbnail', 'page-attributes' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
				'rewrite'         => false,
				'query_var'       => false,
			)
		);
	}

	public static function classic_editor( bool $use, string $post_type ): bool {
		return self::POST_TYPE === $post_type ? false : $use;
	}

	/* ---------- Datos ---------- */

	public static function data( \WP_Post $post ): array {
		$audience = (string) get_post_meta( $post->ID, '_zx_fin_audience', true );
		$url      = (string) get_post_meta( $post->ID, '_zx_fin_url', true );
		return array(
			'id'          => (string) $post->ID,
			'name'        => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
			'logoUrl'     => get_the_post_thumbnail_url( $post, 'medium' ) ?: null,
			'audience'    => isset( self::AUDIENCES[ $audience ] ) ? $audience : 'good',
			'description' => (string) get_post_meta( $post->ID, '_zx_fin_description', true ),
			'applyUrl'    => $url ?: null,
		);
	}

	public static function all(): array {
		$posts = get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => 'publish',
				'numberposts'      => 50,
				'orderby'          => array( 'menu_order' => 'ASC', 'title' => 'ASC' ),
				'suppress_filters' => false,
			)
		);
		return array_map( array( self::class, 'data' ), $posts );
	}

	public static function register_graphql(): void {
		register_graphql_object_type(
			'ZeltronFinancier',
			array(
				'fields' => array(
					'id'          => array( 'type' => array( 'non_null' => 'ID' ) ),
					'name'        => array( 'type' => array( 'non_null' => 'String' ) ),
					'logoUrl'     => array( 'type' => 'String' ),
					'audience'    => array( 'type' => array( 'non_null' => 'String' ), 'description' => 'good | reported | both' ),
					'description' => array( 'type' => array( 'non_null' => 'String' ) ),
					'applyUrl'    => array( 'type' => 'String', 'description' => 'Enlace para solicitar en línea; null = por WhatsApp con un asesor.' ),
				),
			)
		);
		register_graphql_field(
			'RootQuery',
			'zeltronFinanciers',
			array(
				'type'    => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronFinancier' ) ) ),
				'resolve' => static fn() => self::all(),
			)
		);
	}

	/* ---------- Panel ---------- */

	public static function add_meta_boxes(): void {
		add_meta_box( 'zx_fin_box', 'Datos para la tienda', array( self::class, 'render_box' ), self::POST_TYPE, 'normal', 'high' );
	}

	public static function render_box( \WP_Post $post ): void {
		wp_nonce_field( 'zx_fin_save', 'zx_fin_nonce' );
		$audience    = (string) get_post_meta( $post->ID, '_zx_fin_audience', true ) ?: 'good';
		$description = (string) get_post_meta( $post->ID, '_zx_fin_description', true );
		$url         = (string) get_post_meta( $post->ID, '_zx_fin_url', true );
		?>
		<p><strong>¿Para quién es?</strong></p>
		<p>
			<?php foreach ( self::AUDIENCES as $key => $label ) : ?>
				<label style="margin-right:16px"><input type="radio" name="zx_fin_audience" value="<?php echo esc_attr( $key ); ?>" <?php checked( $audience, $key ); ?>> <?php echo esc_html( $label ); ?></label>
			<?php endforeach; ?>
		</p>
		<p><label for="zx_fin_description"><strong>Frase corta</strong></label></p>
		<input type="text" class="widefat" id="zx_fin_description" name="zx_fin_description" maxlength="90" value="<?php echo esc_attr( $description ); ?>" placeholder="Ej.: Paga a cuotas, aprobación en minutos.">
		<p><label for="zx_fin_url"><strong>Enlace para solicitar (opcional)</strong></label></p>
		<input type="url" class="widefat" id="zx_fin_url" name="zx_fin_url" value="<?php echo esc_attr( $url ); ?>" placeholder="https://…">
		<p class="description">Si la financiera te dio un enlace de comercio para que el cliente solicite en línea, pégalo aquí. Si lo dejas vacío, el botón abre WhatsApp con un asesor (para las que se tramitan en el punto de venta).</p>
		<p class="description">Sube el <strong>logo oficial</strong> en el recuadro «Logo oficial» de la derecha (PNG con fondo transparente o blanco). Sin logo, la tienda muestra el nombre. El orden se cambia en «Atributos → Orden».</p>
		<?php
	}

	public static function save( int $post_id ): void {
		if ( ! isset( $_POST['zx_fin_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['zx_fin_nonce'] ) ), 'zx_fin_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$audience = sanitize_key( wp_unslash( (string) ( $_POST['zx_fin_audience'] ?? 'good' ) ) );
		update_post_meta( $post_id, '_zx_fin_audience', isset( self::AUDIENCES[ $audience ] ) ? $audience : 'good' );
		update_post_meta( $post_id, '_zx_fin_description', mb_substr( sanitize_text_field( wp_unslash( (string) ( $_POST['zx_fin_description'] ?? '' ) ) ), 0, 90 ) );
		update_post_meta( $post_id, '_zx_fin_url', esc_url_raw( trim( wp_unslash( (string) ( $_POST['zx_fin_url'] ?? '' ) ) ), array( 'https', 'http' ) ) );
	}

	public static function columns( array $columns ): array {
		return array(
			'cb'          => $columns['cb'] ?? '',
			'zx_logo'     => 'Logo',
			'title'       => 'Financiera',
			'zx_audience' => 'Para',
			'zx_apply'    => 'Se solicita',
			'menu_order'  => 'Orden',
		);
	}

	public static function column( string $column, int $post_id ): void {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}
		$data = self::data( $post );
		if ( 'zx_logo' === $column ) {
			echo $data['logoUrl'] ? '<img src="' . esc_url( $data['logoUrl'] ) . '" alt="" style="max-width:90px;max-height:36px;object-fit:contain">' : '<span style="color:#b32d2e">Falta el logo</span>';
		} elseif ( 'zx_audience' === $column ) {
			echo esc_html( self::AUDIENCES[ $data['audience'] ] );
		} elseif ( 'zx_apply' === $column ) {
			echo $data['applyUrl'] ? 'En línea' : 'Por WhatsApp';
		} elseif ( 'menu_order' === $column ) {
			echo (int) $post->menu_order;
		}
	}

	/** Botón para crear de una vez las financieras del afiche (solo cuando la lista está vacía). */
	public static function starter_notice(): void {
		$screen = get_current_screen();
		if ( ! $screen || 'edit-' . self::POST_TYPE !== $screen->id || ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$count = wp_count_posts( self::POST_TYPE );
		if ( (int) $count->publish + (int) $count->draft + (int) $count->trash > 0 ) {
			return;
		}
		$url = wp_nonce_url( admin_url( 'admin-post.php?action=zeltron_seed_financiers' ), 'zeltron_seed_financiers' );
		echo '<div class="notice notice-info"><p><strong>¿Empezamos rápido?</strong> Crea de una vez Sistecrédito, Brilla, Banco de Bogotá, Addi, SUMAS, PayJoy, Alo Credit y KrediYA. Luego solo entras a cada una a subir su logo oficial.</p><p><a class="button button-primary" href="' . esc_url( $url ) . '">Crear las 8 financieras</a></p></div>';
	}

	public static function seed(): void {
		if ( ! current_user_can( 'edit_posts' ) || ! check_admin_referer( 'zeltron_seed_financiers' ) ) {
			wp_die( 'No permitido.' );
		}
		foreach ( self::STARTER as $i => list( $name, $audience, $description ) ) {
			$id = wp_insert_post(
				array(
					'post_type'   => self::POST_TYPE,
					'post_status' => 'publish',
					'post_title'  => $name,
					'menu_order'  => $i + 1,
				)
			);
			if ( $id && ! is_wp_error( $id ) ) {
				update_post_meta( $id, '_zx_fin_audience', $audience );
				update_post_meta( $id, '_zx_fin_description', $description );
			}
		}
		Revalidation::schedule();
		wp_safe_redirect( admin_url( 'edit.php?post_type=' . self::POST_TYPE ) );
		exit;
	}
}
