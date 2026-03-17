export function canManageContent(dbUser) {
  const roleId = Number(dbUser?.id_role);
  return roleId === 2 || roleId === 3; // Trainer/Admin
}