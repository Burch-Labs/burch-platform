import { redirect } from "next/navigation";

/**
 * The password-based registration form is gone: joining now happens in the same
 * step as signing in, at /auth/join. This redirect stays so existing links,
 * bookmarks and indexed pages do not 404.
 *
 * Password sign-in at /auth/login is deliberately still live — accounts created
 * before this change have passwords, and removing that route would lock them
 * out with no way back in.
 */
export default function RegisterRedirect() {
  redirect("/auth/join");
}
