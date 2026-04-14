export default function LoadingSpinner({ light = false }) {
  return <span aria-hidden="true" className={`spinner ${light ? "is-light" : ""}`} />;
}
