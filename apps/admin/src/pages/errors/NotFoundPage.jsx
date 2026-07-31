import error404Image from "../../assets/images/errors/404.svg";
import error404DarkImage from "../../assets/images/errors/404-dark.svg";
import ErrorPageContent from "../../components/errors/ErrorPageContent.jsx";

function NotFoundPage({ standalone = false }) {
  return (
    <ErrorPageContent
      code="404"
      message="We can’t seem to find the page you are looking for!"
      standalone={standalone}
      lightImage={error404Image}
      darkImage={error404DarkImage}
      illustrationAlt="404 page not found"
    />
  );
}

export default NotFoundPage;
