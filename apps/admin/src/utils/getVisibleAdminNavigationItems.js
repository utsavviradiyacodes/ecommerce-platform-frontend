import { hasAdminPermission } from "./hasAdminPermission.js";

function canAccessNavigationItem(admin, item) {
  if (item.superAdminOnly) {
    return admin?.isSuperAdmin === true;
  }

  if (item.permission) {
    return hasAdminPermission(admin, item.permission);
  }

  return true;
}

export function getVisibleAdminNavigationItems(navItems, admin) {
  return navItems.reduce((visibleItems, navItem) => {
    // Direct navigation item, such as Dashboard
    if (!navItem.subItems) {
      if (canAccessNavigationItem(admin, navItem)) {
        visibleItems.push(navItem);
      }

      return visibleItems;
    }

    // Group, such as Catalog or Commerce
    const visibleSubItems = navItem.subItems.filter((subItem) =>
      canAccessNavigationItem(admin, subItem)
    );

    // Hide the entire group when none of its children are accessible
    if (visibleSubItems.length === 0) {
      return visibleItems;
    }

    visibleItems.push({
      ...navItem,
      subItems: visibleSubItems,
    });

    return visibleItems;
  }, []);
}
