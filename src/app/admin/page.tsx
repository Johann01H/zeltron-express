import { redirect } from 'next/navigation'

// La administración (productos, pedidos, proveedores y márgenes) vive en WordPress.
export default function AdminRedirect() {
  redirect(process.env.NEXT_PUBLIC_WP_ADMIN_URL ?? 'https://admin.zeltronexpress.com/wp-admin/')
}
