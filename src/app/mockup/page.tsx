import { notFound } from "next/navigation";

export const metadata = {
  title: "Website Mockup Preview | Web Growth",
  robots: { index: false, follow: false },
};

export default function MockupPage() {
  notFound();
}
