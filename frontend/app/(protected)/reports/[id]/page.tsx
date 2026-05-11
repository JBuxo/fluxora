"use client";

import { useParams } from "next/navigation";

export default function ReportDetailPage() {
  const params = useParams();

  const reportId = params.id;

  return <div>Report Detail Page for ID: {reportId}</div>;
}
