"use client";

import { Progress } from "@/components/ui/progress";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supportedDistributors } from "@/lib/data/test-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, UploadIcon } from "lucide-react";
import GuideComponent from "./guide-component";
import { guides } from "@/lib/data/guides";

export default function UploadPage() {
  const queryParams = useSearchParams();
  const rawId = queryParams.get("i");
  console.log("Raw distributor ID from query params:", rawId);

  const distributorId = useMemo(() => {
    if (!rawId) return null;
    const n = Number(rawId);
    return Number.isFinite(n) ? n : null;
  }, [rawId]);

  console.log("Parsed distributor ID:", distributorId);

  const distributor = useMemo(() => {
    if (distributorId === null) return null;
    return (
      supportedDistributors.find((d) => Number(d.id) === distributorId) ?? null
    );
  }, [distributorId]);

  console.log("Found distributor:", distributor);

  const guide = useMemo(() => {
    if (distributorId === null) return null;
    return guides[distributorId] ?? null;
  }, [distributorId]);
  console.log("Found guide:", guide);

  const [progress, setProgress] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  const countdownProgress = 100 - progress;

  useEffect(() => {
    if (!distributor) return;

    const duration = 10000;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.min((elapsed / duration) * 100, 100);
      setProgress(percent);
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setOpenDialog(true);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [distributor]);

  if (!rawId) return notFound();
  if (distributorId === null) return notFound();
  if (!distributor) return notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">Upload</h1>

      <section className="mt-6">
        <h2 className="text-2xl">{distributor.name}</h2>

        <p className="text-muted-foreground max-w-lg">
          Once this countdown is done, a dialog will pop up to take you to the
          client portal to download your consumption report.
        </p>

        {countdownProgress > 0 ? (
          <Progress className="mt-4 h-2" value={countdownProgress} />
        ) : (
          <Button
            className="mt-4 ease-in"
            onClick={() => {
              window.open(
                distributor.portalUrl,
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            Go to {distributor.name} <ArrowUpRightIcon />
          </Button>
        )}

        <RedirectDialog
          distributorName={distributor.name}
          distributorPortalUrl={distributor.portalUrl}
          open={openDialog}
          setOpen={setOpenDialog}
        />
      </section>

      <section className="mt-6">
        <div className="bg-muted relative p-8 rounded-md flex flex-col items-center justify-center text-muted-foreground border">
          <UploadIcon className="w-8 h-8 mb-2" strokeWidth={1.25} />
          Drop your files here or click to upload
        </div>
      </section>

      <section className="mt-18">
        <h2 className="text-2xl">Guide</h2>

        <p className="text-muted-foreground max-w-lg">
          Here&apos;s a step by step guide on how to get your consumption report
          from {distributor.name}. Follow the instructions to get your report to
          upload.
        </p>

        <div className="mt-6">
          {guide ? (
            <GuideComponent guide={guide} />
          ) : (
            <div className="rounded-md bg-muted px-6 py-4 text-muted-foreground text-center">
              No guide available for this distributor yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RedirectDialog({
  open,
  setOpen,
  distributorName,
  distributorPortalUrl,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  distributorName: string;
  distributorPortalUrl: string;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{distributorName}</DialogTitle>
          <DialogDescription>
            Going to: {distributorPortalUrl}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            onClick={() => {
              window.open(
                distributorPortalUrl,
                "_blank",
                "noopener,noreferrer",
              );
              setOpen(false);
            }}
          >
            Go <ArrowUpRightIcon />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
