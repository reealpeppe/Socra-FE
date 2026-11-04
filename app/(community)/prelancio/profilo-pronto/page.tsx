import Link from "next/link";

export const metadata = { title: "La tua area di pre-lancio · Socra", robots: { index: false, follow: false } };

export default function Page() {
  return <section className="card"><h1>La tua area Socra</h1><Link href="/dashboard">Vai alla dashboard</Link></section>;
}
