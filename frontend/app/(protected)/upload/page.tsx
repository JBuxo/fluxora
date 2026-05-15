"use client";

import { Progress } from "@/components/ui/progress";
import { notFound, permanentRedirect, useSearchParams } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import SupportedDistributorSelector from "@/components/sections/supported-distributor-selector";

export default function UploadPage() {
  const disabled: boolean = true;

  const queryParams = useSearchParams();
  const rawId = queryParams.get("i");
  const contractId = queryParams.get("c");

  const distributorId = useMemo(() => {
    if (!rawId) return null;
    const n = Number(rawId);
    return Number.isFinite(n) ? n : null;
  }, [rawId]);

  const distributor = useMemo(() => {
    if (distributorId === null) return null;
    return (
      supportedDistributors.find((d) => Number(d.id) === distributorId) ?? null
    );
  }, [distributorId]);

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

  if (!contractId) {
    notFound();
  }

  if (rawId && !distributor) {
    notFound();
  }

  // Re-enable if we ever want manual uploads
  if (disabled) {
    return permanentRedirect("/dashboard", "replace");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">
        {distributor ? `${distributor.name} Upload` : "Upload"}
      </h1>

      <p className="text-muted-foreground max-w-lg">
        {!distributor &&
          "Select your distributor below to continue with the upload process."}
      </p>

      {!distributor ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <SupportedDistributorSelector contractId={contractId} />
        </div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-2xl">Up Next</h2>

            <p className="text-muted-foreground max-w-lg">
              {distributor
                ? "Once this countdown is done, a dialog will pop up to take you to the client portal to download your consumption report. Look at the guide if you need some help!"
                : "Select your distributor below to continue with the upload process."}
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
              Here&apos;s a step by step guide on how to get your consumption
              report from {distributor.name}. Follow the instructions to get
              your report to upload.
            </p>

            {guide && <Separator className="mt-6" />}

            <div>
              {guide ? (
                <GuideComponent guide={guide} />
              ) : (
                <div className="rounded-md bg-muted px-6 py-4 text-muted-foreground text-center mt-6">
                  No guide available for this distributor yet.
                </div>
              )}
            </div>
          </section>
        </>
      )}
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
