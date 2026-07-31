import ErrorPageContent from "../../components/errors/ErrorPageContent.jsx";

function UnauthorizedPage() {
  return (
    <ErrorPageContent
      code="403"
      message="You don’t have permission to access this page."
    />
  );
}

export default UnauthorizedPage;
