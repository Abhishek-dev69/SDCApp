export const validatePassword = (password) => {
  if (password.length < 8) return 'At least 8 characters';
  if (!/[A-Z]/.test(password)) return 'At least one capital letter';
  if (!/[0-9]/.test(password)) return 'At least one number';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'At least one special character';
  if (/\s/.test(password)) return 'No spaces allowed';
  return null;
};