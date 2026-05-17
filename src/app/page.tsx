import Link from "next/link";
import { Landing } from "@/components/landing";

export default function Home() {
  return <Landing />;
}

// keep tree-shake from removing Link import quirk
export const _unused = Link;
