export function hasAdminPermission(admin, requiredPermission) {
  if (!admin) return false;

  if (admin.isSuperAdmin === true) return true;

  return admin?.permissions[requiredPermission] === true;
}
