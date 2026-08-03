import { useEffect, useState } from "react";

function getIsDarkMode() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

export default function useDashboardChartTheme() {
  const [isDarkMode, setIsDarkMode] = useState(getIsDarkMode);

  useEffect(() => {
    const rootElement = document.documentElement;

    const observer = new MutationObserver(() => {
      setIsDarkMode(rootElement.classList.contains("dark"));
    });

    observer.observe(rootElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    isDarkMode,
    textColor: isDarkMode ? "#98A2B3" : "#667085",
    headingColor: isDarkMode ? "#F2F4F7" : "#344054",
    gridColor: isDarkMode ? "rgba(152, 162, 179, 0.18)" : "#E4E7EC",
    trackColor: isDarkMode ? "#344054" : "#F2F4F7",
    tooltipTheme: isDarkMode ? "dark" : "light",
  };
}
