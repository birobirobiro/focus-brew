"use client";

import { useRouter } from "next/navigation";
import FocusBrewLanding from "./landing";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/app");
  };

  return <FocusBrewLanding />;
}
