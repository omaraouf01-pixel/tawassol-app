// Maps a Firebase Auth error (or any thrown Error) into a user-facing message.

export function mapAuthError(err) {
  if (!err) return "Authentication error.";

  const code = err.code || "";
  const msg = err.message || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Invalid credentials.";
    case "auth/user-not-found":
      return "No account found with these details.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/weak-password":
      return "Password too weak (at least 6 characters).";
    case "auth/invalid-email":
      return "Invalid email format.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait and retry.";
    case "auth/network-request-failed":
      return "Network error — check your connection.";
    default:
      break;
  }

  if (/network|fetch/i.test(msg)) return "Network error — check your connection.";
  if (/not.?found/i.test(msg)) return "Academic account not found.";
  if (msg) return msg;
  return "Authentication error.";
}
