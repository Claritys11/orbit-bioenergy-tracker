export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/batches/:path*", "/operations/:path*", "/admin/:path*"],
};
