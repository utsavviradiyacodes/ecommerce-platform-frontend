import authGridImage from "../../../assets/images/auth/grid-01.svg";

function AuthGridShape() {
  return (
    <>
      <div className="absolute top-0 right-0 -z-1 w-full max-w-62.5 xl:max-w-112.5">
        <img src={authGridImage} alt="" />
      </div>

      <div className="absolute bottom-0 left-0 -z-1 w-full max-w-62.5 rotate-180 xl:max-w-112.5">
        <img src={authGridImage} alt="" />
      </div>
    </>
  );
}

export default AuthGridShape;
