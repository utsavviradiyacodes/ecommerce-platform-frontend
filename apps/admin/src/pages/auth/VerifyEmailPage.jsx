import { useSelector } from "react-redux";

import VerifyEmailCodeForm from "../../components/auth/VerifyEmailCodeForm.jsx";
import AuthFormContainer from "../../components/layout/auth/AuthFormContainer.jsx";
import { selectAdminEmailVerificationContext } from "../../features/auth/authSlice.js";

function maskEmail(email) {
  const [localPart, domain] =
    typeof email === "string" ? email.trim().split("@") : [];

  if (!localPart || !domain) {
    return "your Admin email";
  }

  return `${localPart.charAt(0)}***@${domain}`;
}

function VerifyEmailPage() {
  const verificationContext = useSelector(
    selectAdminEmailVerificationContext
  );

  return (
    <AuthFormContainer>
      <VerifyEmailCodeForm
        verificationContext={verificationContext}
        maskedEmail={maskEmail(verificationContext?.email)}
      />
    </AuthFormContainer>
  );
}

export default VerifyEmailPage;
