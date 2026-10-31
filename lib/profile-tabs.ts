/** Pestañas de «Mi cuenta» (compartidas por la página del servidor y el panel del cliente). */
export const PROFILE_TABS = ['pedidos', 'direcciones', 'favoritos', 'configuracion'] as const
export type ProfileTab = (typeof PROFILE_TABS)[number]
