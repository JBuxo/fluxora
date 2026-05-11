"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status?: string;
}

export default function Home() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => setHealthData(data))
      .catch((error) => console.error("Error fetching health check:", error));
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {healthData && <p>Health Check: {healthData.status}</p>}
    </div>
  );
}
