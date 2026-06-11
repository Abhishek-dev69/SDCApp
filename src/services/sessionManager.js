let _clearSession = null;

export function registerClearSession(fn) {
  _clearSession = fn;
}

export function clearSession() {
  if (_clearSession) _clearSession();
}