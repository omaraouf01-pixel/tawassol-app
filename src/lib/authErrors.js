// Maps a Firebase Auth error (or any thrown Error) into a localized message.
// `t` is the i18next translator from useTranslation().

export function mapAuthError(err, t) {
  if (!err) return t("auth.firebase.default");

  const code = err.code || "";
  const msg = err.message || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return t("auth.firebase.invalidCredential");
    case "auth/user-not-found":
      return t("auth.firebase.userNotFound");
    case "auth/wrong-password":
      return t("auth.firebase.wrongPassword");
    case "auth/email-already-in-use":
      return t("auth.firebase.emailInUse");
    case "auth/weak-password":
      return t("auth.firebase.weakPassword");
    case "auth/invalid-email":
      return t("auth.firebase.invalidEmail");
    case "auth/too-many-requests":
      return t("auth.firebase.tooManyRequests");
    case "auth/network-request-failed":
      return t("auth.firebase.networkError");
    default:
      break;
  }

  // Heuristic fallbacks for plain Error messages thrown by our API routes
  if (/network|fetch/i.test(msg)) return t("auth.firebase.networkError");
  if (/not.?found/i.test(msg)) return t("auth.accountNotFound");
  if (msg) return msg;
  return t("auth.firebase.default");
}
