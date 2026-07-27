import { useEffect, useState } from "react";

import { SidebarContext } from "./sidebarContext.js";

export function SidebarProvider({ children }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 1024;

      setIsMobile(mobile);

      if (!mobile) {
        setIsMobileOpen(false);
      }
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function toggleSidebar() {
    setIsExpanded((currentValue) => !currentValue);
  }

  function toggleMobileSidebar() {
    setIsMobileOpen((currentValue) => !currentValue);
  }

  function closeMobileSidebar() {
    setIsMobileOpen(false);
  }

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
        setIsHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
