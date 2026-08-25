module.exports = function requireRole(...roles) {
  // Normalize both sides (trim + lowercase) before comparing. Some accounts
  // have a `role` value in the database that isn't a clean lowercase string
  // (extra whitespace or different casing), which made this strict
  // `roles.includes(req.user.role)` check reject valid users with a 403 even
  // though the role was conceptually correct. The frontend had the exact
  // same class of bug (see LinkGoogleScreen's role routing) — normalizing
  // here fixes it for every route that uses requireRole, not just one.
  const normalizedAllowed = roles.map((r) => String(r).trim().toLowerCase());
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
};