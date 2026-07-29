function AuthFormContainer({ children }) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </div>
  );
}

export default AuthFormContainer;
