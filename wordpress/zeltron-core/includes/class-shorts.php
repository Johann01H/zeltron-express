<?php
namespace Zeltron\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Shorts: videos verticales cortos que muestran los productos en uso.
 *
 * En el panel aparece el menú «Shorts». Cada short tiene:
 * - Video: un MP4 subido a la biblioteca de medios o un enlace de YouTube Shorts / MP4.
 * - Portada (imagen destacada, opcional): si falta se usa el primer cuadro del video.
 * - Producto (opcional): el sitio muestra el precio y el botón «Ver producto».
 * - Texto corto y orden.
 * El sitio los lee con la consulta pública `zeltronShorts`.
 */
final class Shorts {

	public const POST_TYPE   = 'zx_short';
	private const MAX_CAPTION = 150;

	public static function init(): void {
		add_action( 'init', array( self::class, 'register_post_type' ) );
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( self::class, 'save' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_admin' ) );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( self::class, 'columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( self::class, 'column' ), 10, 2 );
		add_filter( 'use_block_editor_for_post_type', array( self::class, 'classic_editor' ), 10, 2 );
		add_filter( 'enter_title_here', array( self::class, 'title_placeholder' ), 10, 2 );
		add_action( 'graphql_register_types', array( self::class, 'register_graphql' ) );
	}

	public static function register_post_type(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'          => array(
					'name'               => 'Shorts',
					'singular_name'      => 'Short',
					'menu_name'          => 'Shorts',
					'add_new'            => 'Subir short',
					'add_new_item'       => 'Nuevo short',
					'edit_item'          => 'Editar short',
					'new_item'           => 'Nuevo short',
					'view_item'          => 'Ver short',
					'search_items'       => 'Buscar shorts',
					'not_found'          => 'Aún no hay shorts. Toca «Subir short» para crear el primero.',
					'not_found_in_trash' => 'No hay shorts en la papelera.',
					'all_items'          => 'Todos los shorts',
					'featured_image'     => 'Portada (opcional)',
					'set_featured_image' => 'Elegir portada',
					'remove_featured_image' => 'Quitar portada',
					'use_featured_image' => 'Usar como portada',
				),
				'description'     => 'Videos cortos demostrativos de los productos.',
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_position'   => 56,
				'menu_icon'       => 'dashicons-video-alt3',
				'supports'        => array( 'title', 'thumbnail', 'page-attributes' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
				'has_archive'     => false,
				'rewrite'         => false,
				'query_var'       => false,
			)
		);
	}

	public static function classic_editor( bool $use, string $post_type ): bool {
		return self::POST_TYPE === $post_type ? false : $use;
	}

	public static function title_placeholder( string $text, \WP_Post $post ): string {
		return self::POST_TYPE === $post->post_type ? 'Título interno, ej.: «Audífonos M10 resistentes al agua»' : $text;
	}

	public static function add_meta_boxes(): void {
		add_meta_box( 'zx_short_video', 'Video del short', array( self::class, 'render_box' ), self::POST_TYPE, 'normal', 'high' );
	}

	public static function enqueue_admin( string $hook ): void {
		$screen = get_current_screen();
		if ( ! $screen || self::POST_TYPE !== $screen->post_type || ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		wp_enqueue_media();
		wp_add_inline_script( 'media-editor', self::admin_script() );
	}

	/** Datos del short listos para el sitio. */
	public static function data( \WP_Post $post ): ?array {
		$video_id  = (int) get_post_meta( $post->ID, '_zx_short_video_id', true );
		$video_url = $video_id ? (string) wp_get_attachment_url( $video_id ) : (string) get_post_meta( $post->ID, '_zx_short_video_url', true );
		if ( ! $video_url ) {
			return null;
		}
		$youtube = self::youtube_id( $video_url );
		$poster  = get_the_post_thumbnail_url( $post, 'large' );
		if ( ! $poster && $youtube ) {
			$poster = 'https://i.ytimg.com/vi/' . $youtube . '/hqdefault.jpg';
		}

		$product_slug = null;
		$product_id   = (int) get_post_meta( $post->ID, '_zx_short_product_id', true );
		if ( $product_id && 'publish' === get_post_status( $product_id ) ) {
			$product_slug = (string) get_post_field( 'post_name', $product_id );
		}

		return array(
			'id'          => (string) $post->ID,
			'title'       => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
			'caption'     => (string) get_post_meta( $post->ID, '_zx_short_caption', true ),
			'videoUrl'    => $youtube ? null : $video_url,
			'youtubeId'   => $youtube,
			'posterUrl'   => $poster ?: null,
			'productSlug' => $product_slug ?: null,
		);
	}

	public static function youtube_id( string $url ): ?string {
		if ( preg_match( '~(?:youtube\.com/(?:shorts/|watch\?v=|embed/|live/)|youtu\.be/)([A-Za-z0-9_-]{11})~', $url, $m ) ) {
			return $m[1];
		}
		return null;
	}

	public static function all( int $limit = 30 ): array {
		$posts = get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => 'publish',
				'numberposts'      => max( 1, min( 60, $limit ) ),
				'orderby'          => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
				'suppress_filters' => false,
			)
		);
		return array_values( array_filter( array_map( array( self::class, 'data' ), $posts ) ) );
	}

	public static function register_graphql(): void {
		register_graphql_object_type(
			'ZeltronShort',
			array(
				'description' => 'Video corto demostrativo.',
				'fields'      => array(
					'id'          => array( 'type' => array( 'non_null' => 'ID' ) ),
					'title'       => array( 'type' => array( 'non_null' => 'String' ) ),
					'caption'     => array( 'type' => array( 'non_null' => 'String' ) ),
					'videoUrl'    => array( 'type' => 'String', 'description' => 'MP4/WebM directo (null si es de YouTube).' ),
					'youtubeId'   => array( 'type' => 'String' ),
					'posterUrl'   => array( 'type' => 'String' ),
					'productSlug' => array( 'type' => 'String' ),
				),
			)
		);
		register_graphql_field(
			'RootQuery',
			'zeltronShorts',
			array(
				'type'    => array( 'non_null' => array( 'list_of' => array( 'non_null' => 'ZeltronShort' ) ) ),
				'args'    => array( 'first' => array( 'type' => 'Int' ) ),
				'resolve' => static fn( $root, array $args ) => self::all( (int) ( $args['first'] ?? 30 ) ),
			)
		);
	}

	public static function render_box( \WP_Post $post ): void {
		wp_nonce_field( 'zx_short_save', 'zx_short_nonce' );
		$video_id   = (int) get_post_meta( $post->ID, '_zx_short_video_id', true );
		$video_url  = (string) get_post_meta( $post->ID, '_zx_short_video_url', true );
		$product_id = (int) get_post_meta( $post->ID, '_zx_short_product_id', true );
		$caption    = (string) get_post_meta( $post->ID, '_zx_short_caption', true );
		$file_url   = $video_id ? (string) wp_get_attachment_url( $video_id ) : '';
		$products   = wc_get_products(
			array(
				'status'  => 'publish',
				'limit'   => -1,
				'orderby' => 'title',
				'order'   => 'ASC',
				'return'  => 'objects',
			)
		);
		$max_upload = size_format( wp_max_upload_size() );
		?>
		<style>
			.zx-short{display:grid;gap:20px;grid-template-columns:minmax(0,1fr) 220px;align-items:start}
			@media(max-width:900px){.zx-short{grid-template-columns:1fr}}
			.zx-short h4{margin:0 0 6px;font-size:13px}
			.zx-short .zx-row{margin-bottom:18px}
			.zx-short .description{margin-top:4px}
			.zx-preview{width:220px;aspect-ratio:9/16;border-radius:14px;background:#0E1A3A;overflow:hidden;display:grid;place-items:center;color:#fff;text-align:center;font-size:12px}
			.zx-preview video,.zx-preview iframe{width:100%;height:100%;object-fit:cover;border:0}
			.zx-tips{margin:0;padding-left:18px;color:#50575e}
			.zx-count{float:right;color:#8c8f94}
		</style>
		<div class="zx-short">
			<div>
				<div class="zx-row">
					<h4>1. Sube el video</h4>
					<input type="hidden" name="zx_short_video_id" id="zx_short_video_id" value="<?php echo esc_attr( (string) ( $video_id ?: '' ) ); ?>">
					<button type="button" class="button button-primary" id="zx_pick_video"><?php echo $video_id ? 'Cambiar video' : 'Elegir o subir video'; ?></button>
					<button type="button" class="button-link-delete" id="zx_clear_video" style="margin-left:8px;<?php echo $video_id ? '' : 'display:none'; ?>">Quitar</button>
					<p class="description" id="zx_video_name"><?php echo $file_url ? esc_html( wp_basename( $file_url ) ) : 'MP4 vertical (9:16), máximo ' . esc_html( $max_upload ) . ' por archivo en tu hosting.'; ?></p>
				</div>
				<div class="zx-row">
					<h4>…o pega un enlace</h4>
					<input type="url" class="widefat" name="zx_short_video_url" id="zx_short_video_url" value="<?php echo esc_attr( $video_url ); ?>" placeholder="https://youtube.com/shorts/…  o  https://…/video.mp4">
					<p class="description">Úsalo si el video ya está en YouTube Shorts (no ocupa espacio en tu hosting). Si subiste un archivo, se usa el archivo.</p>
				</div>
				<div class="zx-row">
					<h4>2. ¿Qué producto muestra?</h4>
					<select name="zx_short_product_id" class="widefat">
						<option value="">— Ninguno —</option>
						<?php foreach ( $products as $product ) : ?>
							<option value="<?php echo esc_attr( (string) $product->get_id() ); ?>" <?php selected( $product_id, $product->get_id() ); ?>>
								<?php echo esc_html( $product->get_name() . ( $product->get_sku() ? ' · ' . $product->get_sku() : '' ) ); ?>
							</option>
						<?php endforeach; ?>
					</select>
					<p class="description">El sitio muestra el precio, el botón «Ver producto» y el video aparece también en la página del producto.</p>
				</div>
				<div class="zx-row">
					<h4>3. Texto corto <span class="zx-count"><span id="zx_caption_count"><?php echo esc_html( (string) mb_strlen( $caption ) ); ?></span>/<?php echo (int) self::MAX_CAPTION; ?></span></h4>
					<textarea name="zx_short_caption" id="zx_short_caption" class="widefat" rows="2" maxlength="<?php echo (int) self::MAX_CAPTION; ?>" placeholder="Ej.: Los probamos bajo la ducha 🚿 y siguen sonando."><?php echo esc_textarea( $caption ); ?></textarea>
				</div>
				<h4>Consejos para grabar</h4>
				<ul class="zx-tips">
					<li>Graba en vertical con el celular, de 10 a 45 segundos.</li>
					<li>Muestra el producto funcionando en los primeros 2 segundos.</li>
					<li>Antes de subir, comprímelo (por ejemplo en CapCut, exportando a 720p): pesa menos y carga rápido.</li>
					<li>El video se reproduce sin sonido hasta que el cliente lo active: agrega subtítulos o texto en pantalla.</li>
					<li>Toca «Publicar» y aparece en la tienda en uno o dos minutos. Para cambiar el orden usa «Atributos → Orden» (el número más bajo va primero).</li>
				</ul>
			</div>
			<div>
				<h4>Vista previa</h4>
				<div class="zx-preview" id="zx_preview">
					<?php
					$yt = self::youtube_id( $video_url );
					if ( $file_url ) {
						echo '<video src="' . esc_url( $file_url ) . '" muted playsinline loop autoplay></video>';
					} elseif ( $yt ) {
						echo '<iframe src="' . esc_url( 'https://www.youtube-nocookie.com/embed/' . $yt ) . '" allowfullscreen></iframe>';
					} else {
						echo '<span>Aquí verás tu video</span>';
					}
					?>
				</div>
			</div>
		</div>
		<?php
	}

	private static function admin_script(): string {
		return <<<'JS'
jQuery(function ($) {
  var frame
  var $id = $('#zx_short_video_id'), $name = $('#zx_video_name'), $preview = $('#zx_preview'), $clear = $('#zx_clear_video'), $pick = $('#zx_pick_video')
  if (!$id.length) return
  $pick.on('click', function (e) {
    e.preventDefault()
    if (!frame) {
      frame = wp.media({ title: 'Elige el video del short', button: { text: 'Usar este video' }, library: { type: 'video' }, multiple: false })
      frame.on('select', function () {
        var file = frame.state().get('selection').first().toJSON()
        $id.val(file.id)
        $name.text(file.filename + (file.filesizeHumanReadable ? ' · ' + file.filesizeHumanReadable : ''))
        $preview.html($('<video muted playsinline loop autoplay>').attr('src', file.url))
        $clear.show(); $pick.text('Cambiar video')
      })
    }
    frame.open()
  })
  $clear.on('click', function (e) {
    e.preventDefault()
    $id.val(''); $name.text('Sin video'); $preview.html('<span>Aquí verás tu video</span>'); $clear.hide(); $pick.text('Elegir o subir video')
  })
  $('#zx_short_caption').on('input', function () { $('#zx_caption_count').text(this.value.length) })
})
JS;
	}

	public static function save( int $post_id, \WP_Post $post ): void {
		if ( ! isset( $_POST['zx_short_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['zx_short_nonce'] ) ), 'zx_short_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$video_id = absint( $_POST['zx_short_video_id'] ?? 0 );
		if ( $video_id && ! str_starts_with( (string) get_post_mime_type( $video_id ), 'video/' ) ) {
			$video_id = 0;
		}
		update_post_meta( $post_id, '_zx_short_video_id', $video_id ?: '' );

		$url = esc_url_raw( trim( wp_unslash( (string) ( $_POST['zx_short_video_url'] ?? '' ) ) ), array( 'https', 'http' ) );
		update_post_meta( $post_id, '_zx_short_video_url', $url );

		$product_id = absint( $_POST['zx_short_product_id'] ?? 0 );
		update_post_meta( $post_id, '_zx_short_product_id', $product_id && 'product' === get_post_type( $product_id ) ? $product_id : '' );

		$caption = sanitize_textarea_field( wp_unslash( (string) ( $_POST['zx_short_caption'] ?? '' ) ) );
		update_post_meta( $post_id, '_zx_short_caption', mb_substr( $caption, 0, self::MAX_CAPTION ) );
	}

	public static function columns( array $columns ): array {
		return array(
			'cb'          => $columns['cb'] ?? '',
			'zx_preview'  => 'Video',
			'title'       => 'Título',
			'zx_product'  => 'Producto',
			'menu_order'  => 'Orden',
			'date'        => $columns['date'] ?? 'Fecha',
		);
	}

	public static function column( string $column, int $post_id ): void {
		$post = get_post( $post_id );
		if ( 'zx_preview' === $column ) {
			$data = $post ? self::data( $post ) : null;
			if ( ! $data ) {
				echo '<span style="color:#b32d2e">Sin video</span>';
			} elseif ( $data['posterUrl'] ) {
				echo '<img src="' . esc_url( $data['posterUrl'] ) . '" alt="" style="width:45px;height:80px;object-fit:cover;border-radius:6px">';
			} else {
				echo '<video src="' . esc_url( $data['videoUrl'] . '#t=0.5' ) . '" muted preload="metadata" style="width:45px;height:80px;object-fit:cover;border-radius:6px;background:#0E1A3A"></video>';
			}
		} elseif ( 'zx_product' === $column ) {
			$product_id = (int) get_post_meta( $post_id, '_zx_short_product_id', true );
			echo $product_id ? '<a href="' . esc_url( (string) get_edit_post_link( $product_id ) ) . '">' . esc_html( get_the_title( $product_id ) ) . '</a>' : '—';
		} elseif ( 'menu_order' === $column && $post ) {
			echo (int) $post->menu_order;
		}
	}
}
