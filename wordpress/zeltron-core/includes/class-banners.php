<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Banners publicitarios en mosaico para el inicio de la tienda.
 *
 * - Menú «Banners»: cada banner es una imagen con su tamaño en el mosaico
 *   (grande, vertical, pequeño o ancho) y a dónde lleva (producto, categoría o enlace).
 * - «Banners → Secciones»: cada sección es un bloque del inicio con título
 *   (ej. «Llévate el que estabas esperando ✨»), su «Ver todo» y una fila de productos
 *   de la categoría elegida.
 * El sitio lo lee con la consulta pública `zeltronBannerSections`.
 */
final class Banners {

	public const POST_TYPE = 'zx_banner';
	public const TAXONOMY  = 'zx_banner_section';

	/** Tamaños del mosaico y medida recomendada de la imagen. */
	public const SIZES = array(
		'large' => array( 'Grande', '1200 × 940 px' ),
		'tall'  => array( 'Vertical', '600 × 940 px' ),
		'small' => array( 'Pequeño', '600 × 460 px' ),
		'wide'  => array( 'Ancho completo', '2400 × 450 px' ),
	);

	public static function init(): void {
		add_action( 'init', array( self::class, 'register' ) );
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( self::class, 'save' ), 10, 2 );
		add_filter( 'use_block_editor_for_post_type', array( self::class, 'classic_editor' ), 10, 2 );
		add_filter( 'enter_title_here', array( self::class, 'title_placeholder' ), 10, 2 );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( self::class, 'columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( self::class, 'column' ), 10, 2 );
		add_action( self::TAXONOMY . '_add_form_fields', array( self::class, 'section_add_fields' ) );
		add_action( self::TAXONOMY . '_edit_form_fields', array( self::class, 'section_edit_fields' ) );
		add_action( 'created_' . self::TAXONOMY, array( self::class, 'save_section' ) );
		add_action( 'edited_' . self::TAXONOMY, array( self::class, 'save_section' ) );
		add_action( 'graphql_register_types', array( self::class, 'register_graphql' ) );
	}

	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'          => array(
					'name'                  => 'Banners',
					'singular_name'         => 'Banner',
					'menu_name'             => 'Banners',
					'add_new'               => 'Nuevo banner',
					'add_new_item'          => 'Nuevo banner',
					'edit_item'             => 'Editar banner',
					'search_items'          => 'Buscar banners',
					'not_found'             => 'Aún no hay banners. Toca «Nuevo banner» para crear el primero.',
					'not_found_in_trash'    => 'No hay banners en la papelera.',
					'all_items'             => 'Todos los banners',
					'featured_image'        => 'Imagen del banner',
					'set_featured_image'    => 'Elegir imagen del banner',
					'remove_featured_image' => 'Quitar imagen',
					'use_featured_image'    => 'Usar como imagen del banner',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_position'   => 57,
				'menu_icon'       => 'dashicons-format-gallery',
				'supports'        => array( 'title', 'thumbnail', 'page-attributes' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
				'rewrite'         => false,
				'query_var'       => false,
			)
		);

		register_taxonomy(
			self::TAXONOMY,
			self::POST_TYPE,
			array(
				'labels'            => array(
					'name'          => 'Secciones',
					'singular_name' => 'Sección',
					'menu_name'     => 'Secciones',
					'add_new_item'  => 'Nueva sección',
					'edit_item'     => 'Editar sección',
					'search_items'  => 'Buscar secciones',
					'not_found'     => 'Aún no hay secciones.',
					'all_items'     => 'Todas las secciones',
					'back_to_items' => '← Volver a las secciones',
				),
				'public'            => false,
				'show_ui'           => true,
				'show_admin_column' => true,
				'hierarchical'      => true, // Casillas de selección en el editor del banner.
				'rewrite'           => false,
				'query_var'         => false,
			)
		);
	}

	public static function classic_editor( bool $use, string $post_type ): bool {
		return self::POST_TYPE === $post_type ? false : $use;
	}

	public static function title_placeholder( string $text, \WP_Post $post ): string {
		return self::POST_TYPE === $post->post_type ? 'Nombre del banner, ej.: «Honor X8d + parlante 21 % dto»' : $text;
	}

	/* ---------- Datos para el sitio ---------- */

	/** Opciones de categoría: «Audio» y «Audio › Audífonos». */
	private static function category_options(): array {
		$default = (int) get_option( 'default_product_cat' );
		$out     = array();
		$parents = get_terms( array( 'taxonomy' => 'product_cat', 'parent' => 0, 'hide_empty' => false, 'menu_order' => 'ASC' ) );
		foreach ( is_array( $parents ) ? $parents : array() as $parent ) {
			if ( (int) $parent->term_id === $default ) {
				continue;
			}
			$out[ $parent->term_id ] = html_entity_decode( $parent->name, ENT_QUOTES, 'UTF-8' );
			$children                = get_terms( array( 'taxonomy' => 'product_cat', 'parent' => $parent->term_id, 'hide_empty' => false, 'menu_order' => 'ASC' ) );
			foreach ( is_array( $children ) ? $children : array() as $child ) {
				$out[ $child->term_id ] = $out[ $parent->term_id ] . ' › ' . html_entity_decode( $child->name, ENT_QUOTES, 'UTF-8' );
			}
		}
		return $out;
	}

	/** @return array{category: ?string, subcategory: ?string} */
	private static function category_names( int $term_id ): array {
		$term = $term_id ? get_term( $term_id, 'product_cat' ) : null;
		if ( ! $term instanceof \WP_Term ) {
			return array( 'category' => null, 'subcategory' => null );
		}
		$name = html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' );
		if ( $term->parent ) {
			$parent = get_term( $term->parent, 'product_cat' );
			if ( $parent instanceof \WP_Term ) {
				return array( 'category' => html_entity_decode( $parent->name, ENT_QUOTES, 'UTF-8' ), 'subcategory' => $name );
			}
		}
		return array( 'category' => $name, 'subcategory' => null );
	}

	private static function category_href( ?string $category, ?string $subcategory ): ?string {
		if ( ! $category ) {
			return null;
		}
		return '/productos?categoria=' . rawurlencode( $category ) . ( $subcategory ? '&subcategoria=' . rawurlencode( $subcategory ) : '' );
	}

	public static function banner_data( \WP_Post $post ): ?array {
		$image_id = (int) get_post_thumbnail_id( $post );
		$image    = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';
		if ( ! $image ) {
			return null;
		}
		$until = (string) get_post_meta( $post->ID, '_zx_banner_until', true );
		if ( $until && strtotime( $until . ' 23:59:59 ' . wp_timezone_string() ) < time() ) {
			return null; // Campaña vencida.
		}
		$mobile_id = (int) get_post_meta( $post->ID, '_zx_banner_mobile_id', true );
		$size      = (string) get_post_meta( $post->ID, '_zx_banner_size', true );
		$link      = (string) get_post_meta( $post->ID, '_zx_banner_link', true );

		$href         = null;
		$product_slug = null;
		if ( 'product' === $link ) {
			$product_id = (int) get_post_meta( $post->ID, '_zx_banner_product_id', true );
			if ( $product_id && 'publish' === get_post_status( $product_id ) ) {
				$product_slug = (string) get_post_field( 'post_name', $product_id );
				$href         = '/producto/' . $product_slug;
			}
		} elseif ( 'category' === $link ) {
			$names = self::category_names( (int) get_post_meta( $post->ID, '_zx_banner_category_id', true ) );
			$href  = self::category_href( $names['category'], $names['subcategory'] );
		} elseif ( 'url' === $link ) {
			$href = (string) get_post_meta( $post->ID, '_zx_banner_url', true ) ?: null;
		}

		$alt = trim( (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true ) );
		return array(
			'id'             => (string) $post->ID,
			'title'          => $alt ?: html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
			'size'           => isset( self::SIZES[ $size ] ) ? $size : 'small',
			'imageUrl'       => $image,
			'mobileImageUrl' => $mobile_id ? ( wp_get_attachment_image_url( $mobile_id, 'full' ) ?: null ) : null,
			'href'           => $href,
			'productSlug'    => $product_slug,
		);
	}

	public static function sections(): array {
		$banners = get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => 'publish',
				'numberposts'      => 100,
				'orderby'          => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
				'suppress_filters' => false,
			)
		);
		$grouped = array();
		foreach ( $banners as $post ) {
			$data = self::banner_data( $post );
			if ( ! $data ) {
				continue;
			}
			$terms = get_the_terms( $post, self::TAXONOMY );
			$ids   = is_array( $terms ) && $terms ? wp_list_pluck( $terms, 'term_id' ) : array( 0 );
			foreach ( $ids as $term_id ) {
				$grouped[ (int) $term_id ][] = $data;
			}
		}

		$out = array();
		foreach ( $grouped as $term_id => $items ) {
			$term  = $term_id ? get_term( $term_id, self::TAXONOMY ) : null;
			$names = $term instanceof \WP_Term ? self::category_names( (int) get_term_meta( $term_id, '_zx_section_category_id', true ) ) : array( 'category' => null, 'subcategory' => null );
			$out[] = array(
				'id'          => (string) $term_id,
				'title'       => $term instanceof \WP_Term ? html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' ) : 'Destacados',
				'subtitle'    => $term instanceof \WP_Term ? wp_strip_all_tags( $term->description ) : '',
				'category'    => $names['category'],
				'subcategory' => $names['subcategory'],
				'viewAllHref' => self::category_href( $names['category'], $names['subcategory'] ),
				'order'       => $term instanceof \WP_Term ? (int) get_term_meta( $term_id, '_zx_section_order', true ) : 999,
				'banners'     => $items,
			);
		}
		usort( $out, static fn( $a, $b ) => $a['order'] <=> $b['order'] );
		return $out;
	}

	public static function register_graphql(): void {
		register_graphql_object_type(
			'ZeltronBanner',
			array(
				'fields' => array(
					'id'             => array( 'type' => array( 'non_null' => 'ID' ) ),
					'title'          => array( 'type' => array( 'non_null' => 'String' ) ),
					'size'           => array( 'type' => array( 'non_null' => 'String' ), 'description' => 'large | tall | small | wide' ),
					'imageUrl'       => array( 'type' => array( 'non_null' => 'String' ) ),
					'mobileImageUrl' => array( 'type' => 'String' ),
					'href'           => array( 'type' => 'String' ),
					'productSlug'    => array( 'type' => 'String' ),
				),
			)
		);
		register_graphql_object_type(
			'ZeltronBannerSection',
			array(
				'fields' => array(
					'id'          => array( 'type' => array( 'non_null' => 'ID' ) ),
					'title'       => array( 'type' => array( 'non_null' => 'String' ) ),
					'subtitle'    => array( 'type' => array( 'non_null' => 'String' ) ),
					'category'    => array( 'type' => 'String' ),
					'subcategory' => array( 'type' => 'String' ),
					'viewAllHref' => array( 'type' => 'String' ),
					'banners'     => array( 'type' => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronBanner' ) ) ) ),
				),
			)
		);
		register_graphql_field(
			'RootQuery',
			'zeltronBannerSections',
			array(
				'type'    => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronBannerSection' ) ) ),
				'resolve' => static fn() => self::sections(),
			)
		);
	}

	/* ---------- Panel: banner ---------- */

	public static function add_meta_boxes(): void {
		add_meta_box( 'zx_banner_box', 'Tamaño y enlace del banner', array( self::class, 'render_box' ), self::POST_TYPE, 'normal', 'high' );
	}

	public static function render_box( \WP_Post $post ): void {
		wp_nonce_field( 'zx_banner_save', 'zx_banner_nonce' );
		$size        = (string) get_post_meta( $post->ID, '_zx_banner_size', true ) ?: 'large';
		$link        = (string) get_post_meta( $post->ID, '_zx_banner_link', true ) ?: 'product';
		$product_id  = (int) get_post_meta( $post->ID, '_zx_banner_product_id', true );
		$category_id = (int) get_post_meta( $post->ID, '_zx_banner_category_id', true );
		$url         = (string) get_post_meta( $post->ID, '_zx_banner_url', true );
		$until       = (string) get_post_meta( $post->ID, '_zx_banner_until', true );
		$mobile_id   = (int) get_post_meta( $post->ID, '_zx_banner_mobile_id', true );
		$products    = wc_get_products( array( 'status' => 'publish', 'limit' => -1, 'orderby' => 'title', 'order' => 'ASC' ) );
		wp_enqueue_media();
		?>
		<style>
			.zx-b h4{margin:18px 0 8px;font-size:13px}.zx-b h4:first-child{margin-top:4px}
			.zx-sizes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
			@media(max-width:900px){.zx-sizes{grid-template-columns:repeat(2,minmax(0,1fr))}}
			.zx-size{display:block;border:2px solid #dcdcde;border-radius:10px;padding:10px;cursor:pointer;background:#fff}
			.zx-size:has(input:checked){border-color:#2F5BFF;background:#f0f4ff}
			.zx-size input{position:absolute;opacity:0}
			.zx-size strong{display:block;margin-top:8px}.zx-size small{color:#646970}
			.zx-mosaic{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,14px);gap:3px}
			.zx-mosaic i{background:#dcdcde;border-radius:2px}.zx-mosaic i.on{background:#2F5BFF}
			.zx-links label{margin-right:16px}
			.zx-pane{margin-top:8px}
		</style>
		<div class="zx-b">
			<h4>1. ¿Qué tamaño tiene en el mosaico?</h4>
			<div class="zx-sizes">
				<?php
				$mosaics = array(
					'large' => '<i class="on" style="grid-column:span 2;grid-row:span 2"></i><i style="grid-row:span 2"></i><i></i><i></i>',
					'tall'  => '<i style="grid-column:span 2;grid-row:span 2"></i><i class="on" style="grid-row:span 2"></i><i></i><i></i>',
					'small' => '<i style="grid-column:span 2;grid-row:span 2"></i><i style="grid-row:span 2"></i><i class="on"></i><i></i>',
					'wide'  => '<i class="on" style="grid-column:span 4"></i><i></i><i></i><i></i><i></i>',
				);
				foreach ( self::SIZES as $key => list( $label, $hint ) ) :
					?>
					<label class="zx-size">
						<input type="radio" name="zx_banner_size" value="<?php echo esc_attr( $key ); ?>" <?php checked( $size, $key ); ?>>
						<span class="zx-mosaic" aria-hidden="true"><?php echo $mosaics[ $key ]; // phpcs:ignore WordPress.Security.EscapeOutput -- marcado fijo. ?></span>
						<strong><?php echo esc_html( $label ); ?></strong>
						<small>Imagen de <?php echo esc_html( $hint ); ?></small>
					</label>
				<?php endforeach; ?>
			</div>
			<p class="description">El mosaico clásico es 1 grande + 1 vertical + 2 pequeños. Deja el texto importante lejos de los bordes: en celular la imagen se recorta un poco.</p>

			<h4>2. ¿A dónde lleva al tocarlo?</h4>
			<div class="zx-links">
				<label><input type="radio" name="zx_banner_link" value="product" <?php checked( $link, 'product' ); ?>> Un producto</label>
				<label><input type="radio" name="zx_banner_link" value="category" <?php checked( $link, 'category' ); ?>> Una categoría</label>
				<label><input type="radio" name="zx_banner_link" value="url" <?php checked( $link, 'url' ); ?>> Otro enlace</label>
				<label><input type="radio" name="zx_banner_link" value="none" <?php checked( $link, 'none' ); ?>> Ninguno</label>
			</div>
			<div class="zx-pane" data-pane="product">
				<select name="zx_banner_product_id" class="widefat">
					<option value="">— Elige el producto —</option>
					<?php foreach ( $products as $product ) : ?>
						<option value="<?php echo esc_attr( (string) $product->get_id() ); ?>" <?php selected( $product_id, $product->get_id() ); ?>><?php echo esc_html( $product->get_name() . ( $product->get_sku() ? ' · ' . $product->get_sku() : '' ) ); ?></option>
					<?php endforeach; ?>
				</select>
				<p class="description">El producto también aparece primero en la fila de productos de la sección.</p>
			</div>
			<div class="zx-pane" data-pane="category">
				<select name="zx_banner_category_id" class="widefat">
					<option value="">— Elige la categoría —</option>
					<?php foreach ( self::category_options() as $id => $label ) : ?>
						<option value="<?php echo esc_attr( (string) $id ); ?>" <?php selected( $category_id, $id ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</div>
			<div class="zx-pane" data-pane="url">
				<input type="text" class="widefat" name="zx_banner_url" value="<?php echo esc_attr( $url ); ?>" placeholder="/productos?oferta=true  o  https://…">
			</div>

			<h4>3. Opcional</h4>
			<p>
				<label>Mostrar hasta el <input type="date" name="zx_banner_until" value="<?php echo esc_attr( $until ); ?>"></label>
				<span class="description">— al día siguiente se oculta solo. Vacío = siempre.</span>
			</p>
			<p>
				<input type="hidden" name="zx_banner_mobile_id" id="zx_banner_mobile_id" value="<?php echo esc_attr( (string) ( $mobile_id ?: '' ) ); ?>">
				<button type="button" class="button" id="zx_banner_mobile_pick">Imagen distinta para celular</button>
				<span id="zx_banner_mobile_name" class="description"><?php echo $mobile_id ? esc_html( wp_basename( (string) wp_get_attachment_url( $mobile_id ) ) ) . ' · <a href="#" id="zx_banner_mobile_clear">quitar</a>' : 'Si no eliges una, se usa la misma imagen.'; // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			</p>
			<p class="description">La imagen principal va en el recuadro «Imagen del banner» de la derecha. Escribe su «Texto alternativo» en la biblioteca de medios (ej. «Honor X8d con 21 % de descuento»): lo leen Google y las personas con lector de pantalla.</p>
		</div>
		<script>
		jQuery(function ($) {
			function sync() { var v = $('input[name=zx_banner_link]:checked').val(); $('.zx-pane').hide().filter('[data-pane="' + v + '"]').show() }
			$('input[name=zx_banner_link]').on('change', sync); sync()
			var frame
			$('#zx_banner_mobile_pick').on('click', function (e) {
				e.preventDefault()
				frame = frame || wp.media({ title: 'Imagen para celular', button: { text: 'Usar esta imagen' }, library: { type: 'image' }, multiple: false })
				frame.off('select').on('select', function () {
					var f = frame.state().get('selection').first().toJSON()
					$('#zx_banner_mobile_id').val(f.id); $('#zx_banner_mobile_name').text(f.filename)
				})
				frame.open()
			})
			$(document).on('click', '#zx_banner_mobile_clear', function (e) { e.preventDefault(); $('#zx_banner_mobile_id').val(''); $('#zx_banner_mobile_name').text('Si no eliges una, se usa la misma imagen.') })
		})
		</script>
		<?php
	}

	public static function save( int $post_id ): void {
		if ( ! isset( $_POST['zx_banner_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['zx_banner_nonce'] ) ), 'zx_banner_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$size = sanitize_key( wp_unslash( (string) ( $_POST['zx_banner_size'] ?? 'large' ) ) );
		update_post_meta( $post_id, '_zx_banner_size', isset( self::SIZES[ $size ] ) ? $size : 'large' );

		$link = sanitize_key( wp_unslash( (string) ( $_POST['zx_banner_link'] ?? 'none' ) ) );
		update_post_meta( $post_id, '_zx_banner_link', in_array( $link, array( 'product', 'category', 'url', 'none' ), true ) ? $link : 'none' );

		$product_id = absint( $_POST['zx_banner_product_id'] ?? 0 );
		update_post_meta( $post_id, '_zx_banner_product_id', $product_id && 'product' === get_post_type( $product_id ) ? $product_id : '' );
		$category_id = absint( $_POST['zx_banner_category_id'] ?? 0 );
		update_post_meta( $post_id, '_zx_banner_category_id', $category_id && term_exists( $category_id, 'product_cat' ) ? $category_id : '' );

		$url = trim( wp_unslash( (string) ( $_POST['zx_banner_url'] ?? '' ) ) );
		// Rutas de la tienda (/productos…) o enlaces completos http(s).
		$url = str_starts_with( $url, '/' ) && ! str_starts_with( $url, '//' ) ? esc_url_raw( $url ) : esc_url_raw( $url, array( 'https', 'http' ) );
		update_post_meta( $post_id, '_zx_banner_url', $url );

		$until = sanitize_text_field( wp_unslash( (string) ( $_POST['zx_banner_until'] ?? '' ) ) );
		update_post_meta( $post_id, '_zx_banner_until', preg_match( '/^\d{4}-\d{2}-\d{2}$/', $until ) ? $until : '' );

		$mobile_id = absint( $_POST['zx_banner_mobile_id'] ?? 0 );
		update_post_meta( $post_id, '_zx_banner_mobile_id', $mobile_id && wp_attachment_is_image( $mobile_id ) ? $mobile_id : '' );
	}

	public static function columns( array $columns ): array {
		return array(
			'cb'                        => $columns['cb'] ?? '',
			'zx_image'                  => 'Imagen',
			'title'                     => 'Banner',
			'taxonomy-' . self::TAXONOMY => 'Sección',
			'zx_size'                   => 'Tamaño',
			'zx_link'                   => 'Lleva a',
			'menu_order'                => 'Orden',
			'date'                      => $columns['date'] ?? 'Fecha',
		);
	}

	public static function column( string $column, int $post_id ): void {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}
		if ( 'zx_image' === $column ) {
			$img = get_the_post_thumbnail_url( $post, 'thumbnail' );
			echo $img ? '<img src="' . esc_url( $img ) . '" alt="" style="width:70px;height:46px;object-fit:cover;border-radius:6px">' : '<span style="color:#b32d2e">Sin imagen</span>';
		} elseif ( 'zx_size' === $column ) {
			$size = (string) get_post_meta( $post_id, '_zx_banner_size', true );
			echo esc_html( self::SIZES[ $size ][0] ?? '—' );
			$until = (string) get_post_meta( $post_id, '_zx_banner_until', true );
			if ( $until ) {
				echo '<br><small>Hasta ' . esc_html( $until ) . '</small>';
			}
		} elseif ( 'zx_link' === $column ) {
			$data = self::banner_data( $post );
			echo $data && $data['href'] ? '<code>' . esc_html( $data['href'] ) . '</code>' : '—';
		} elseif ( 'menu_order' === $column ) {
			echo (int) $post->menu_order;
		}
	}

	/* ---------- Panel: secciones ---------- */

	private static function category_select( int $category_id ): string {
		ob_start();
		?>
		<select name="zx_section_category_id" id="zx_section_category_id" class="postform">
			<option value="">— Ninguna —</option>
			<?php foreach ( self::category_options() as $id => $label ) : ?>
				<option value="<?php echo esc_attr( (string) $id ); ?>" <?php selected( $category_id, $id ); ?>><?php echo esc_html( $label ); ?></option>
			<?php endforeach; ?>
		</select>
		<p class="description">Debajo de los banners se muestran los productos de esta categoría (primero los que tienen descuento), y «Ver todo» lleva a ella.</p>
		<?php
		return (string) ob_get_clean();
	}

	public static function section_add_fields(): void {
		$select = self::category_select( 0 );
		?>
		<div class="form-field">
			<label for="zx_section_category_id">Categoría de productos</label>
			<?php echo $select; // phpcs:ignore WordPress.Security.EscapeOutput -- escapado al construirlo. ?>
		</div>
		<div class="form-field">
			<label for="zx_section_order">Orden en el inicio</label>
			<input type="number" name="zx_section_order" id="zx_section_order" value="0" style="width:6rem">
			<p class="description">El número más bajo va primero.</p>
		</div>
		<p class="description">El «Nombre» es el título que se ve en la tienda; puedes usar emojis. La «Descripción» es un subtítulo opcional.</p>
		<?php
	}

	public static function section_edit_fields( \WP_Term $term ): void {
		$order          = (int) get_term_meta( $term->term_id, '_zx_section_order', true );
		$select = self::category_select( (int) get_term_meta( $term->term_id, '_zx_section_category_id', true ) );
		?>
		<tr class="form-field">
			<th scope="row"><label for="zx_section_category_id">Categoría de productos</label></th>
			<td><?php echo $select; // phpcs:ignore WordPress.Security.EscapeOutput -- escapado al construirlo. ?></td>
		</tr>
		<tr class="form-field">
			<th scope="row"><label for="zx_section_order">Orden en el inicio</label></th>
			<td><input type="number" name="zx_section_order" id="zx_section_order" value="<?php echo esc_attr( (string) $order ); ?>" style="width:6rem"><p class="description">El número más bajo va primero.</p></td>
		</tr>
		<?php
	}

	public static function save_section( int $term_id ): void {
		if ( ! current_user_can( 'manage_categories' ) || ! isset( $_POST['zx_section_order'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification -- WordPress ya verifica el nonce del formulario de términos.
			return;
		}
		$category_id = absint( $_POST['zx_section_category_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification
		update_term_meta( $term_id, '_zx_section_category_id', $category_id && term_exists( $category_id, 'product_cat' ) ? $category_id : '' );
		update_term_meta( $term_id, '_zx_section_order', (int) $_POST['zx_section_order'] ); // phpcs:ignore WordPress.Security.NonceVerification
		Revalidation::schedule();
	}
}
