function Table({ children, className = "" }) {
  return <table className={`min-w-full ${className}`}>{children}</table>;
}

function TableHeader({ children, className = "" }) {
  return <thead className={className}>{children}</thead>;
}

function TableBody({ children, className = "" }) {
  return <tbody className={className}>{children}</tbody>;
}

function TableRow({ children, className = "" }) {
  return <tr className={className}>{children}</tr>;
}

function TableCell({
  children,
  isHeader = false,
  className = "",
  ...cellProps
}) {
  const CellTag = isHeader ? "th" : "td";

  return (
    <CellTag {...cellProps} className={className}>
      {children}
    </CellTag>
  );
}

export { Table, TableBody, TableCell, TableHeader, TableRow };
