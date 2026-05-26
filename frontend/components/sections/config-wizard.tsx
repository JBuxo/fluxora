"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import Loader from "../ui/loader";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type UsagePattern = {
  occupants: string;
  homeSize: string;
  heatingType: string;
  hotWater: string;
  appliances: string[];
  homeDays: string[];
  workFromHome: string;
  wakeTime: string;
  sleepTime: string;
  laundryTime: string;
  cookingMeals: string[];
};

const defaultPattern: UsagePattern = {
  occupants: "",
  homeSize: "",
  heatingType: "",
  hotWater: "",
  appliances: [],
  homeDays: [],
  workFromHome: "",
  wakeTime: "",
  sleepTime: "",
  laundryTime: "",
  cookingMeals: [],
};

type TariffRates = {
  energyRateKwh: string;
  powerRatePeakKwDay: string;
  powerRateValleyKwDay: string;
};

const defaultRates: TariffRates = {
  energyRateKwh: "0.1199",
  powerRatePeakKwDay: "0.119151",
  powerRateValleyKwDay: "0.058877",
};

// ── Primitives ─────────────────────────────────────────────────────────────

function Q({
  question,
  hint,
  children,
}: {
  question: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{question}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ToggleButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="rounded-full px-4 flex-1"
    >
      {label}
    </Button>
  );
}

// ── Step components ────────────────────────────────────────────────────────

function DatadisSourceStep() {
  return (
    <div className="space-y-4">
      <p>
        Go to{" "}
        <Link
          href="https://datadis.es/register"
          target="_blank"
          className="font-semibold underline inline-flex items-center gap-1"
        >
          Datadis <ExternalLink className="w-4 h-4" />
        </Link>{" "}
        and sign up if you haven&apos;t already. It&apos;s the official Spanish
        grid portal — it gives us secure access to your consumption history.
      </p>
      <p className="font-medium">
        Note: you&apos;ll need the same DNI and password on the next step.
      </p>
      <p className="text-muted-foreground">
        Once you have an account, come back and continue here.
      </p>
    </div>
  );
}

function ConnectDatadisStep() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" placeholder="12345678A" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="datadis_password">Password</Label>
          <div className="relative">
            <Input
              id="datadis_password"
              type={showPassword ? "text" : "password"}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0  px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            <p className="text-muted-foreground mt-2">
              Enter the credentials you used to sign up at Datadis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function YourHomeStep({
  pattern,
  setPattern,
}: {
  pattern: UsagePattern;
  setPattern: (p: UsagePattern) => void;
}) {
  function pick(field: keyof UsagePattern, value: string) {
    setPattern({ ...pattern, [field]: pattern[field] === value ? "" : value });
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">Just the basics about your place.</p>

      <Q question="How many people live there?">
        {["1", "2", "3", "4", "5+"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.occupants === o}
            onClick={() => pick("occupants", o)}
          />
        ))}
      </Q>

      <Q question="How big is your home?">
        {["< 50 m²", "50–90 m²", "90–150 m²", "> 150 m²"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.homeSize === o}
            onClick={() => pick("homeSize", o)}
          />
        ))}
      </Q>
    </div>
  );
}

function YourAppliancesStep({
  pattern,
  setPattern,
}: {
  pattern: UsagePattern;
  setPattern: (p: UsagePattern) => void;
}) {
  function pick(field: keyof UsagePattern, value: string) {
    setPattern({ ...pattern, [field]: pattern[field] === value ? "" : value });
  }

  function toggle(value: string) {
    const appliances = pattern.appliances ?? [];
    const next = appliances.includes(value)
      ? appliances.filter((v) => v !== value)
      : [...appliances, value];
    setPattern({ ...pattern, appliances: next });
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">
        These are the biggest drivers of your bill.
      </p>

      <Q question="How do you heat your home?">
        {["Electric heat pump", "Gas", "Diesel", "None / other"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.heatingType === o}
            onClick={() => pick("heatingType", o)}
          />
        ))}
      </Q>

      <Q
        question="How do you heat water?"
        hint="Electric boilers typically account for 20–30% of the bill."
      >
        {["Electric boiler", "Gas boiler", "Heat pump", "Solar"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.hotWater === o}
            onClick={() => pick("hotWater", o)}
          />
        ))}
      </Q>

      <Q question="Which of these do you have?" hint="Select all that apply.">
        {[
          "Air conditioning",
          "Dishwasher",
          "Tumble dryer",
          "Electric vehicle",
          "Solar panels",
        ].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={(pattern.appliances ?? []).includes(o)}
            onClick={() => toggle(o)}
          />
        ))}
      </Q>
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function YourRoutineStep({
  pattern,
  setPattern,
}: {
  pattern: UsagePattern;
  setPattern: (p: UsagePattern) => void;
}) {
  function pick(field: keyof UsagePattern, value: string) {
    setPattern({ ...pattern, [field]: pattern[field] === value ? "" : value });
  }

  function toggleMulti(field: "homeDays" | "cookingMeals", value: string) {
    const current = pattern[field] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setPattern({ ...pattern, [field]: next });
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">
        Your schedule tells us when to shift heavy loads to cheaper hours.
      </p>

      <Q question="Which days is someone usually home?">
        {DAYS.map((d) => (
          <ToggleButton
            key={d}
            label={d}
            selected={(pattern.homeDays ?? []).includes(d)}
            onClick={() => toggleMulti("homeDays", d)}
          />
        ))}
      </Q>

      <Q question="Do you work from home?">
        {["Always", "Sometimes", "Never"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.workFromHome === o}
            onClick={() => pick("workFromHome", o)}
          />
        ))}
      </Q>

      <Q question="What time do you usually wake up?">
        {["Before 7:00", "7:00–9:00", "After 9:00"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.wakeTime === o}
            onClick={() => pick("wakeTime", o)}
          />
        ))}
      </Q>

      <Q question="What time do you go to sleep?">
        {["Before 23:00", "23:00–01:00", "After 01:00"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.sleepTime === o}
            onClick={() => pick("sleepTime", o)}
          />
        ))}
      </Q>

      <Q
        question="When do you usually run the washing machine?"
        hint="Night (23:00+) and weekends are the cheapest hours on your tariff."
      >
        {[
          "Early morning (6–9)",
          "Morning (9–13)",
          "Afternoon (13–18)",
          "Evening (18–23)",
          "Night (23+)",
        ].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={pattern.laundryTime === o}
            onClick={() => pick("laundryTime", o)}
          />
        ))}
      </Q>

      <Q question="Which meals do you usually cook at home?">
        {["Breakfast", "Lunch", "Dinner"].map((o) => (
          <ToggleButton
            key={o}
            label={o}
            selected={(pattern.cookingMeals ?? []).includes(o)}
            onClick={() => toggleMulti("cookingMeals", o)}
          />
        ))}
      </Q>
    </div>
  );
}

function TariffStep({
  rates,
  setRates,
}: {
  rates: TariffRates;
  setRates: (r: TariffRates) => void;
}) {
  function set(field: keyof TariffRates, value: string) {
    setRates({ ...rates, [field]: value });
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <p className="text-muted-foreground">
        Find these on your electricity bill or your provider&apos;s website.
        We&apos;ve pre-filled typical Spanish market values.
      </p>

      <div className="space-y-2">
        <Label htmlFor="energy_rate">Precio de energía consumida (€/kWh)</Label>
        <Input
          id="energy_rate"
          type="number"
          step="0.000001"
          min="0"
          value={rates.energyRateKwh}
          onChange={(e) => set("energyRateKwh", e.target.value)}
          placeholder="0.1199"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="power_peak">Precio de potencia — Punta (€/kW día)</Label>
        <Input
          id="power_peak"
          type="number"
          step="0.000001"
          min="0"
          value={rates.powerRatePeakKwDay}
          onChange={(e) => set("powerRatePeakKwDay", e.target.value)}
          placeholder="0.119151"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="power_valley">Precio de potencia — Valle (€/kW día)</Label>
        <Input
          id="power_valley"
          type="number"
          step="0.000001"
          min="0"
          value={rates.powerRateValleyKwDay}
          onChange={(e) => set("powerRateValleyKwDay", e.target.value)}
          placeholder="0.058877"
        />
      </div>
    </div>
  );
}

// ── Sync success animation ────────────────────────────────────────────────

function SyncSuccess() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <CheckCircle2
        className="w-16 h-16 text-primary animate-in zoom-in-50 duration-500"
        strokeWidth={1.5}
      />
      <p className="font-semibold text-base animate-in fade-in-0 duration-300">
        All set!
      </p>
      <p className="text-sm text-muted-foreground animate-in fade-in-0 duration-300">
        Taking you to your dashboard…
      </p>
    </div>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────

export default function ConfigWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [pattern, setPattern] = useState<UsagePattern>(defaultPattern);
  const [rates, setRates] = useState<TariffRates>(defaultRates);
  const contentRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const router = useRouter();
  const { authHeader } = useAuth();

  async function handleFinish() {
    setSyncing(true);
    try {
      const headers = { "Content-Type": "application/json", Authorization: authHeader };

      const createRes = await fetch("/api/homes", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "My Home" }),
      });
      if (!createRes.ok) return;

      const home = await createRes.json();

      await fetch(`/api/homes/${home.id}/sync`, { method: "POST", headers });

      await Promise.all([
        fetch(`/api/homes/${home.id}/usage-profile`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            occupants: pattern.occupants || null,
            home_size: pattern.homeSize || null,
            heating_type: pattern.heatingType || null,
            hot_water: pattern.hotWater || null,
            appliances: pattern.appliances,
            home_days: pattern.homeDays,
            work_from_home: pattern.workFromHome || null,
            wake_time: pattern.wakeTime || null,
            sleep_time: pattern.sleepTime || null,
            laundry_time: pattern.laundryTime || null,
            cooking_meals: pattern.cookingMeals,
          }),
        }),
        fetch(`/api/homes/${home.id}/tariff`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            energy_rate_kwh: rates.energyRateKwh ? parseFloat(rates.energyRateKwh) : null,
            power_rate_peak_kw_day: rates.powerRatePeakKwDay ? parseFloat(rates.powerRatePeakKwDay) : null,
            power_rate_valley_kw_day: rates.powerRateValleyKwDay ? parseFloat(rates.powerRateValleyKwDay) : null,
          }),
        }),
      ]);

      setSyncDone(true);
    } catch {
      setSyncDone(true); // still proceed on error
    }
  }

  useEffect(() => {
    if (!syncDone) return;
    const redirectTimer = setTimeout(() => router.push("/dashboard"), 2000);
    return () => clearTimeout(redirectTimer);
  }, [syncDone, router]);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setCardHeight(contentRef.current.scrollHeight);
    }
  }, [step]);

  function goNext() {
    setDir("forward");
    setStep((s) => s + 1);
  }

  function goPrev() {
    setDir("back");
    setStep((s) => s - 1);
  }

  const steps = [
    {
      title: "Set up Datadis",
      content: <DatadisSourceStep />,
    },
    {
      title: "Connect to Fluxora",
      content: <ConnectDatadisStep />,
    },
    {
      title: "About your home",
      content: <YourHomeStep pattern={pattern} setPattern={setPattern} />,
    },
    {
      title: "Your appliances",
      content: <YourAppliancesStep pattern={pattern} setPattern={setPattern} />,
    },
    {
      title: "Your daily routine",
      content: <YourRoutineStep pattern={pattern} setPattern={setPattern} />,
    },
    {
      title: "Your electricity tariff",
      content: <TariffStep rates={rates} setRates={setRates} />,
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Let&apos;s Get You Started</h1>

      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                i < step
                  ? "text-primary"
                  : i === step
                    ? "text-primary/70"
                    : "text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <div
              className={cn(
                "h-1.5 w-full rounded-full transition-colors",
                i < step
                  ? "bg-primary"
                  : i === step
                    ? "bg-primary/50"
                    : "bg-muted",
              )}
            />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl">
              {step + 1}. {steps[step].title}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={
              cardHeight !== undefined ? { height: cardHeight } : undefined
            }
            className="overflow-hidden transition-[height] duration-200 ease-in-out"
          >
            <div ref={contentRef}>
              <div
                key={step}
                className={cn(
                  "animate-in fade-in-0 duration-200",
                  dir === "forward"
                    ? "slide-in-from-right-4"
                    : "slide-in-from-left-4",
                )}
              >
                {steps[step].content}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={goPrev}>
          <ChevronLeftIcon /> Previous
        </Button>
        {isLast ? (
          <Button onClick={handleFinish}>Finish</Button>
        ) : (
          <Button onClick={goNext}>
            {step === steps.length - 2 ? "Almost done" : "Next"}
            <ChevronRightIcon />
          </Button>
        )}
      </div>

      <Dialog open={syncing} onOpenChange={setSyncing}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-xs text-center"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {syncDone ? (
            <SyncSuccess />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Fetching your data</DialogTitle>
                <DialogDescription>
                  Connecting to Datadis and pulling your consumption history.
                  This may take a moment.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <Loader />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
