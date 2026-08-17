import { Suspense } from "react";
import TopLoader from "@/components/TopLoader";

export default function TopLoaderWrapper() {
  return (
    <Suspense fallback={null}>
      <TopLoader />
    </Suspense>
  );
}
