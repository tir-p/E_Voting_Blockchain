import Link from "next/link";

export default function ProceedButton() {
  return (
    <Link className="cta-button" href="/voter">
      Proceed to Vote
    </Link>
  );
}
