"use client";

export function getUserFromStorage() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function checkPermission(permissionKey: string): boolean {
  const user = getUserFromStorage();
  if (!user || !user.permissions) return false;
  
  const permissions: string[] = user.permissions || [];
  
  // Super Admin wildcard
  if (permissions.includes("*")) return true;
  
  return permissions.includes(permissionKey);
}

// Module-level access: e.g. hasModuleAccess("students") returns true if user has ANY "students:*" permission
export function hasModuleAccess(moduleKey: string): boolean {
  const user = getUserFromStorage();
  if (!user || !user.permissions) return false;
  
  const permissions: string[] = user.permissions || [];
  
  if (permissions.includes("*")) return true;
  
  // Basic mapping of modules to permissions
  const moduleMap: Record<string, string[]> = {
    "students": ["VIEW_STUDENTS", "MANAGE_USERS"],
    "staff": ["MANAGE_USERS", "MANAGE_ROLES"],
    "masterdata": ["MANAGE_ACADEMICS", "MANAGE_ROLES"],
    "attendance": ["MARK_ATTENDANCE", "VIEW_STUDENTS"],
    "reportcards": ["MANAGE_GRADES", "VIEW_REPORTS", "MANAGE_EXAMS"],
    "roles": ["MANAGE_ROLES", "MANAGE_USERS"],
    "fees": ["MANAGE_FEES", "VIEW_REPORTS"],
    "healthrecords": ["MANAGE_HEALTH_RECORDS"],
    "discipline": ["MANAGE_DISCIPLINE"],
    "admissionspipeline": ["MANAGE_ADMISSIONS_PIPELINE"]
  };

  const reqPerms = moduleMap[moduleKey] || [];
  
  return permissions.some(p => p.startsWith(`${moduleKey}:`) || reqPerms.includes(p));
}
