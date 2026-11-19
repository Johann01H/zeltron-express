<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Portada (slider principal del inicio).
 *
 * Menú «Portada»: cada diapositiva tiene etiqueta, título grande, texto, dos botones y,
 * a la derecha, la tarjeta de envío con un producto destacado, una imagen propia o nada.
 * El sitio la lee con la consulta pública `zeltronHeroSlides`; sin diapositivas publicadas
 * se muestra la portada de siempre.
 */
final class Hero_Slides {

	public const POST_TYPE = 'zx_hero_slide';

	private const DEFAULTS = array(
		'pill'           => 'Pagas cuando recibes tu pedido',
		'primary_text'   => 'Ver ofertas',
		'primary_href'   => '/productos?oferta=true',
		'secondary_text' => 'Explorar catálogo',
		'secondary_href' => '/productos',
		'card_label'     => 'Destacado de la semana',
	);

	public static function init(): void {
		add_action( 'init', array( self::class, 'register' ) );
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( self::class, 'save' ) );
		add_filter( 'use_block_editor_for_post_type', array( self::class, 'classic_editor' ), 10, 2 );
		add_filter( 'enter_title_here', array( self::class, 'title_placeholder' ), 10, 2 );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( self::class, 'columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( self::class, 'column' ), 10, 2 );
		add_action( 'graphql_register_types', array( self::class, 'register_graphql' ) );
	}

	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'          => array(
					'name'                  => 'Portada',
					'singular_name'         => 'Diapositiva',
					'menu_name'             => 'Portada',
					'add_new'               => 'Nueva diapositiva',
					'add_new_item'          => 'Nueva diapositiva de la portada',
					'edit_item'             => 'Editar diapositiva',
					'search_items'          => 'Buscar diapositivas',
					'not_found'             => 'Aún no hay diapositivas: la tienda muestra la portada de siempre.',
					'not_found_in_trash'    => 'No hay diapositivas en la papelera.',
					'all_items'             => 'Diapositivas',
					'featured_image'        => 'Imagen de la tarjeta (opcional)',
					'set_featured_image'    => 'Elegir imagen',
					'remove_featured_image' => 'Quitar imagen',
					'use_featured_image'    => 'Usar esta imagen',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_position'   => 55,
				'menu_icon'       => 'dashicons-slides',
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

	public static function title_placeholder( string $text, \WP_Post $post ): string {
		return self::POST_TYPE === $post->post_type ? 'Título grande, ej.: «Tecnología que llega a tu puerta.»' : $text;
	}

	private static function meta( int $id, string $key ): string {
		$value = (string) get_post_meta( $id, '_zx_hero_' . $key, true );
		return '' === $value && isset( self::DEFAULTS[ $key ] ) && ! metadata_exists( 'post', $id, '_zx_hero_' . $key ) ? self::DEFAULTS[ $key ] : $value;
	}

	/* ---------- Datos ---------- */

	public static function data( \WP_Post $post ): ?array {
		$until = self::meta( $post->ID, 'until' );
		if ( $until && strtotime( $until . ' 23:59:59 ' . wp_timezone_string() ) < time() ) {
			return null;
		}
		$mode = self::meta( $post->ID, 'card' ) ?: 'product';
		$src  = 'image' === $mode && has_post_thumbnail( $post ) ? wp_get_attachment_image_src( (int) get_post_thumbnail_id( $post ), 'full' ) : false;
		if ( 'image' === $mode && ! $src ) {
			$mode = 'product';
		}
		$product_slug = null;
		$product_id   = (int) self::meta( $post->ID, 'product_id' );
		if ( $product_id && 'publish' === get_post_status( $product_id ) ) {
			$product_slug = (string) get_post_field( 'post_name', $product_id );
		}
		return array(
			'id'            => (string) $post->ID,
			'pill'          => self::meta( $post->ID, 'pill' ),
			'title'         => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
			'description'   => self::meta( $post->ID, 'description' ),
			'primaryText'   => self::meta( $post->ID, 'primary_text' ),
			'primaryHref'   => self::meta( $post->ID, 'primary_href' ),
			'secondaryText' => self::meta( $post->ID, 'secondary_text' ),
			'secondaryHref' => self::meta( $post->ID, 'secondary_href' ),
			'card'          => in_array( $mode, array( 'product', 'image', 'none' ), true ) ? $mode : 'product',
			'cardLabel'     => self::meta( $post->ID, 'card_label' ),
			'productSlug'   => $product_slug,
			'imageUrl'      => $src ? (string) $src[0] : null,
			'imageWidth'    => $src ? ( (int) $src[1] ?: null ) : null,
			'imageHeight'   => $src ? ( (int) $src[2] ?: null ) : null,
			'imageHref'     => self::meta( $post->ID, 'image_href' ) ?: null,
		) + self::full_image( $post->ID );
	}

	/** Diapositiva «Imagen completa»: la imagen ocupa toda la portada (con versión opcional para celular). */
	private static function full_image( int $id ): array {
		$layout = 'image' === self::meta( $id, 'layout' ) ? 'image' : 'text';
		$desk   = (int) self::meta( $id, 'full_id' );
		$mob    = (int) self::meta( $id, 'full_mobile_id' );
		$d      = $desk ? wp_get_attachment_image_src( $desk, 'full' ) : false;
		$m      = $mob ? wp_get_attachment_image_src( $mob, 'full' ) : false;
		if ( 'image' === $layout && ! $d ) {
			$layout = 'text';
		}
		return array(
			'layout'          => $layout,
			'fullImageUrl'    => $d ? (string) $d[0] : null,
			'fullWidth'       => $d ? ( (int) $d[1] ?: null ) : null,
			'fullHeight'      => $d ? ( (int) $d[2] ?: null ) : null,
			'fullMobileUrl'   => $m ? (string) $m[0] : null,
			'fullMobileWidth' => $m ? ( (int) $m[1] ?: null ) : null,
			'fullMobileHeight'=> $m ? ( (int) $m[2] ?: null ) : null,
			'fullHref'        => self::meta( $id, 'full_href' ) ?: null,
		);
	}

	public static function all(): array {
		$posts = get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => 'publish',
				'numberposts'      => 12,
				'orderby'          => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
				'suppress_filters' => false,
			)
		);
		return array_values( array_filter( array_map( array( self::class, 'data' ), $posts ) ) );
	}

	public static function register_graphql(): void {
		$string = array( 'type' => 'String' );
		register_graphql_object_type(
			'ZeltronHeroSlide',
			array(
				'fields' => array(
					'id'            => array( 'type' => array( 'non_null' => 'ID' ) ),
					'pill'          => array( 'type' => array( 'non_null' => 'String' ) ),
					'title'         => array( 'type' => array( 'non_null' => 'String' ) ),
					'description'   => array( 'type' => array( 'non_null' => 'String' ) ),
					'primaryText'   => array( 'type' => array( 'non_null' => 'String' ) ),
					'primaryHref'   => array( 'type' => array( 'non_null' => 'String' ) ),
					'secondaryText' => array( 'type' => array( 'non_null' => 'String' ) ),
					'secondaryHref' => array( 'type' => array( 'non_null' => 'String' ) ),
					'card'          => array( 'type' => array( 'non_null' => 'String' ), 'description' => 'product | image | none' ),
					'cardLabel'     => array( 'type' => array( 'non_null' => 'String' ) ),
					'productSlug'   => $string,
					'imageUrl'      => $string,
					'imageWidth'    => array( 'type' => 'Int' ),
					'imageHeight'   => array( 'type' => 'Int' ),
					'imageHref'     => $string,
					'layout'           => array( 'type' => array( 'non_null' => 'String' ), 'description' => 'text | image' ),
					'fullImageUrl'     => $string,
					'fullWidth'        => array( 'type' => 'Int' ),
					'fullHeight'       => array( 'type' => 'Int' ),
					'fullMobileUrl'    => $string,
					'fullMobileWidth'  => array( 'type' => 'Int' ),
					'fullMobileHeight' => array( 'type' => 'Int' ),
					'fullHref'         => $string,
				),
			)
		);
		register_graphql_field(
			'RootQuery',
			'zeltronHeroSlides',
			array(
				'type'    => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronHeroSlide' ) ) ),
				'resolve' => static fn() => self::all(),
			)
		);
	}

	/* ---------- Panel ---------- */

	public static function add_meta_boxes(): void {
		add_meta_box( 'zx_hero_box', 'Contenido de la diapositiva', array( self::class, 'render_box' ), self::POST_TYPE, 'normal', 'high' );
	}

	public static function render_box( \WP_Post $post ): void {
		wp_nonce_field( 'zx_hero_save', 'zx_hero_nonce' );
		$m          = static fn( string $k ) => self::meta( $post->ID, $k );
		$card       = $m( 'card' ) ?: 'product';
		$product_id = (int) $m( 'product_id' );
		$products   = wc_get_products( array( 'status' => 'publish', 'limit' => -1, 'orderby' => 'title', 'order' => 'ASC' ) );
		$layout     = 'image' === $m( 'layout' ) ? 'image' : 'text';
		$full       = (int) $m( 'full_id' );
		$full_mob   = (int) $m( 'full_mobile_id' );
		wp_enqueue_media();
		?>
		<style>
			.zx-h label.t{display:block;font-weight:600;margin:16px 0 6px}
			.zx-h .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
			@media(max-width:900px){.zx-h .row{grid-template-columns:1fr}}
			.zx-h fieldset{border:1px solid #dcdcde;border-radius:10px;padding:4px 14px 14px;margin-top:16px}
			.zx-h legend{font-weight:600;padding:0 6px}
		</style>
		<div class="zx-h">
			<fieldset style="margin-top:4px">
				<legend>Tipo de diapositiva</legend>
				<p>
					<label style="margin-right:16px"><input type="radio" name="zx_hero_layout" value="text" <?php checked( $layout, 'text' ); ?>> Texto y tarjeta (como la portada actual)</label>
					<label><input type="radio" name="zx_hero_layout" value="image" <?php checked( $layout, 'image' ); ?>> <strong>Imagen completa</strong> (tu imagen ocupa toda la portada)</label>
				</p>
				<div data-zx-layout="image">
					<div class="row">
						<?php foreach ( array( 'full_id' => array( 'Imagen para computador', '1920 × 720 px', $full ), 'full_mobile_id' => array( 'Imagen para celular (opcional)', '1080 × 1350 px', $full_mob ) ) as $key => list( $label, $size, $att ) ) : ?>
							<div class="zx-pick" data-key="<?php echo esc_attr( $key ); ?>">
								<label class="t"><?php echo esc_html( $label ); ?> <span class="description">· recomendado <?php echo esc_html( $size ); ?></span></label>
								<input type="hidden" name="zx_hero_<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( (string) ( $att ?: '' ) ); ?>">
								<div class="zx-prev" style="margin-bottom:8px"><?php echo $att ? wp_get_attachment_image( $att, 'medium', false, array( 'style' => 'max-width:100%;height:auto;border-radius:8px' ) ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
								<button type="button" class="button zx-pick-btn"><?php echo $att ? 'Cambiar imagen' : 'Elegir imagen'; ?></button>
								<button type="button" class="button-link-delete zx-pick-clear" style="margin-left:8px;<?php echo $att ? '' : 'display:none'; ?>">Quitar</button>
							</div>
						<?php endforeach; ?>
					</div>
					<label class="t" for="zx_hero_full_href">Al tocar la imagen lleva a (opcional)</label>
					<input type="text" class="widefat" id="zx_hero_full_href" name="zx_hero_full_href" value="<?php echo esc_attr( $m( 'full_href' ) ); ?>" placeholder="/credito  o  /productos?oferta=true">
					<p class="description">La imagen se ve completa, sin recortes, de borde a borde. Diseña el texto y los botones dentro de la imagen. Usa la misma medida en todas tus diapositivas para que la portada no cambie de alto. El «Título» solo se usa como descripción para Google y lectores de pantalla.</p>
				</div>
			</fieldset>
			<div data-zx-layout="text">
			<p class="description">El título grande es el «Título» de arriba. Si lo quieres en dos líneas, escríbelo completo: la tienda lo acomoda sola.</p>

			<label class="t" for="zx_hero_pill">Etiqueta pequeña (arriba del título)</label>
			<input type="text" class="widefat" id="zx_hero_pill" name="zx_hero_pill" maxlength="60" value="<?php echo esc_attr( $m( 'pill' ) ); ?>" placeholder="Pagas cuando recibes tu pedido">

			<label class="t" for="zx_hero_description">Texto</label>
			<textarea class="widefat" id="zx_hero_description" name="zx_hero_description" rows="3" maxlength="240" placeholder="Audífonos, cargadores, relojes y accesorios con precios claros…"><?php echo esc_textarea( $m( 'description' ) ); ?></textarea>

			<fieldset>
				<legend>Botones</legend>
				<div class="row">
					<div><label class="t" for="zx_hero_primary_text">Botón amarillo: texto</label><input type="text" class="widefat" id="zx_hero_primary_text" name="zx_hero_primary_text" maxlength="30" value="<?php echo esc_attr( $m( 'primary_text' ) ); ?>"></div>
					<div><label class="t" for="zx_hero_primary_href">Botón amarillo: enlace</label><input type="text" class="widefat" id="zx_hero_primary_href" name="zx_hero_primary_href" value="<?php echo esc_attr( $m( 'primary_href' ) ); ?>" placeholder="/productos?oferta=true"></div>
					<div><label class="t" for="zx_hero_secondary_text">Botón con borde: texto</label><input type="text" class="widefat" id="zx_hero_secondary_text" name="zx_hero_secondary_text" maxlength="30" value="<?php echo esc_attr( $m( 'secondary_text' ) ); ?>"></div>
					<div><label class="t" for="zx_hero_secondary_href">Botón con borde: enlace</label><input type="text" class="widefat" id="zx_hero_secondary_href" name="zx_hero_secondary_href" value="<?php echo esc_attr( $m( 'secondary_href' ) ); ?>" placeholder="/productos"></div>
				</div>
				<p class="description">Enlaces de la tienda empiezan por «/» (ej. <code>/credito</code>, <code>/productos?categoria=Audio</code>). Deja el texto vacío para ocultar un botón.</p>
			</fieldset>

			<fieldset>
				<legend>Lado derecho</legend>
				<p>
					<label style="margin-right:16px"><input type="radio" name="zx_hero_card" value="product" <?php checked( $card, 'product' ); ?>> Tarjeta de envío con un producto</label>
					<label style="margin-right:16px"><input type="radio" name="zx_hero_card" value="image" <?php checked( $card, 'image' ); ?>> Imagen propia</label>
					<label><input type="radio" name="zx_hero_card" value="none" <?php checked( $card, 'none' ); ?>> Nada</label>
				</p>
				<div class="row">
					<div>
						<label class="t" for="zx_hero_product_id">Producto de la tarjeta</label>
						<select class="widefat" id="zx_hero_product_id" name="zx_hero_product_id">
							<option value="">— El más vendido (automático) —</option>
							<?php foreach ( $products as $product ) : ?>
								<option value="<?php echo esc_attr( (string) $product->get_id() ); ?>" <?php selected( $product_id, $product->get_id() ); ?>><?php echo esc_html( $product->get_name() . ( $product->get_sku() ? ' · ' . $product->get_sku() : '' ) ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>
					<div><label class="t" for="zx_hero_card_label">Texto sobre el nombre</label><input type="text" class="widefat" id="zx_hero_card_label" name="zx_hero_card_label" maxlength="40" value="<?php echo esc_attr( $m( 'card_label' ) ); ?>" placeholder="Destacado de la semana"></div>
				</div>
				<p class="description">Con «Imagen propia», sube la imagen en el recuadro «Imagen de la tarjeta» de la derecha (PNG con fondo transparente queda muy bien, unos 1000 × 800 px). Se muestra completa, sin recortes.</p>
				<label class="t" for="zx_hero_image_href">Enlace de la imagen propia (opcional)</label>
				<input type="text" class="widefat" id="zx_hero_image_href" name="zx_hero_image_href" value="<?php echo esc_attr( $m( 'image_href' ) ); ?>" placeholder="/credito">
			</fieldset>

			</div>

			<label class="t" for="zx_hero_until">Mostrar hasta (opcional)</label>
			<input type="date" id="zx_hero_until" name="zx_hero_until" value="<?php echo esc_attr( $m( 'until' ) ); ?>">
			<span class="description">— al día siguiente se oculta sola. El orden se cambia en «Atributos → Orden».</span>
		</div>
		<script>
		jQuery(function ($) {
			function sync() { var v = $('input[name=zx_hero_layout]:checked').val(); $('[data-zx-layout]').hide().filter('[data-zx-layout="' + v + '"]').show() }
			$('input[name=zx_hero_layout]').on('change', sync); sync()
			$('.zx-pick').each(function () {
				var $box = $(this), frame
				$box.find('.zx-pick-btn').on('click', function (e) {
					e.preventDefault()
					frame = frame || wp.media({ title: 'Imagen de la portada', button: { text: 'Usar esta imagen' }, library: { type: 'image' }, multiple: false })
					frame.off('select').on('select', function () {
						var f = frame.state().get('selection').first().toJSON()
						$box.find('input[type=hidden]').val(f.id)
						$box.find('.zx-prev').html($('<img style="max-width:100%;height:auto;border-radius:8px">').attr('src', (f.sizes && f.sizes.medium ? f.sizes.medium.url : f.url)))
						$box.find('.zx-pick-btn').text('Cambiar imagen'); $box.find('.zx-pick-clear').show()
					})
					frame.open()
				})
				$box.find('.zx-pick-clear').on('click', function (e) {
					e.preventDefault(); $box.find('input[type=hidden]').val(''); $box.find('.zx-prev').empty(); $(this).hide(); $box.find('.zx-pick-btn').text('Elegir imagen')
				})
			})
		})
		</script>
		<?php
	}

	private static function clean_href( string $href ): string {
		$href = trim( $href );
		if ( '' === $href ) {
			return '';
		}
		return str_starts_with( $href, '/' ) && ! str_starts_with( $href, '//' ) ? esc_url_raw( $href ) : esc_url_raw( $href, array( 'https', 'http' ) );
	}

	public static function save( int $post_id ): void {
		if ( ! isset( $_POST['zx_hero_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['zx_hero_nonce'] ) ), 'zx_hero_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$text = static fn( string $k, int $max ) => mb_substr( sanitize_text_field( wp_unslash( (string) ( $_POST[ 'zx_hero_' . $k ] ?? '' ) ) ), 0, $max ); // phpcs:ignore WordPress.Security.NonceVerification -- verificado arriba.
		update_post_meta( $post_id, '_zx_hero_pill', $text( 'pill', 60 ) );
		update_post_meta( $post_id, '_zx_hero_description', mb_substr( sanitize_textarea_field( wp_unslash( (string) ( $_POST['zx_hero_description'] ?? '' ) ) ), 0, 240 ) );
		update_post_meta( $post_id, '_zx_hero_primary_text', $text( 'primary_text', 30 ) );
		update_post_meta( $post_id, '_zx_hero_secondary_text', $text( 'secondary_text', 30 ) );
		update_post_meta( $post_id, '_zx_hero_card_label', $text( 'card_label', 40 ) );
		foreach ( array( 'primary_href', 'secondary_href', 'image_href' ) as $key ) {
			update_post_meta( $post_id, '_zx_hero_' . $key, self::clean_href( wp_unslash( (string) ( $_POST[ 'zx_hero_' . $key ] ?? '' ) ) ) );
		}
		$card = sanitize_key( wp_unslash( (string) ( $_POST['zx_hero_card'] ?? 'product' ) ) );
		update_post_meta( $post_id, '_zx_hero_card', in_array( $card, array( 'product', 'image', 'none' ), true ) ? $card : 'product' );
		$product_id = absint( $_POST['zx_hero_product_id'] ?? 0 );
		update_post_meta( $post_id, '_zx_hero_product_id', $product_id && 'product' === get_post_type( $product_id ) ? $product_id : '' );
		$layout = sanitize_key( wp_unslash( (string) ( $_POST['zx_hero_layout'] ?? 'text' ) ) );
		update_post_meta( $post_id, '_zx_hero_layout', 'image' === $layout ? 'image' : 'text' );
		foreach ( array( 'full_id', 'full_mobile_id' ) as $key ) {
			$att = absint( $_POST[ 'zx_hero_' . $key ] ?? 0 );
			update_post_meta( $post_id, '_zx_hero_' . $key, $att && wp_attachment_is_image( $att ) ? $att : '' );
		}
		update_post_meta( $post_id, '_zx_hero_full_href', self::clean_href( wp_unslash( (string) ( $_POST['zx_hero_full_href'] ?? '' ) ) ) );
		$until = $text( 'until', 10 );
		update_post_meta( $post_id, '_zx_hero_until', preg_match( '/^\d{4}-\d{2}-\d{2}$/', $until ) ? $until : '' );
	}

	public static function columns( array $columns ): array {
		return array(
			'cb'         => $columns['cb'] ?? '',
			'title'      => 'Título',
			'zx_side'    => 'Contenido',
			'zx_until'   => 'Hasta',
			'menu_order' => 'Orden',
			'date'       => $columns['date'] ?? 'Fecha',
		);
	}

	public static function column( string $column, int $post_id ): void {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}
		if ( 'zx_side' === $column ) {
			$card = self::meta( $post_id, 'card' ) ?: 'product';
			$full = 'image' === self::meta( $post_id, 'layout' ) ? (int) self::meta( $post_id, 'full_id' ) : 0;
			if ( $full ) {
				echo wp_get_attachment_image( $full, array( 160, 60 ), false, array( 'style' => 'max-height:60px;width:auto;border-radius:4px' ) ) . '<br><small>Imagen completa</small>';
			} elseif ( 'image' === $card && has_post_thumbnail( $post ) ) {
				echo get_the_post_thumbnail( $post, array( 80, 60 ), array( 'style' => 'max-height:60px;width:auto' ) );
			} elseif ( 'none' === $card ) {
				echo 'Nada';
			} else {
				$pid = (int) self::meta( $post_id, 'product_id' );
				echo esc_html( $pid ? 'Tarjeta: ' . get_the_title( $pid ) : 'Tarjeta: más vendido' );
			}
		} elseif ( 'zx_until' === $column ) {
			echo esc_html( self::meta( $post_id, 'until' ) ?: '—' );
		} elseif ( 'menu_order' === $column ) {
			echo (int) $post->menu_order;
		}
	}
}
