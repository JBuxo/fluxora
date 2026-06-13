"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/hooks/use-auth";
import type { HomeWithContracts } from "@/lib/types/api";
import { HomeIcon, ZapIcon, CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface HomeState {
  id: string;
  name: string;
  address: string;
  supplyPointId: string | null;
  energyRate: string;
  powerRatePeak: string;
  powerRateValley: string;
  saving: boolean;
  saved: boolean;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { authHeader } = useAuth();
  const [homes, setHomes] = useState<HomeState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authHeader) return;
    fetch("/api/homes/with-contracts", { headers: { Authorization: authHeader } })
      .then((r) => r.json())
      .then((data: HomeWithContracts[]) => {
        setHomes(
          data.map((h) => {
            const sp = h.supply_points[0] ?? null;
            const contract = sp?.active_contract ?? null;
            return {
              id: h.id,
              name: h.name,
              address: h.address ?? "",
              supplyPointId: sp?.id ?? null,
              energyRate: contract ? "" : "",
              powerRatePeak: "",
              powerRateValley: "",
              saving: false,
              saved: false,
            };
          })
        );
      })
      .finally(() => setLoading(false));
  }, [authHeader]);

  function update(id: string, patch: Partial<HomeState>) {
    setHomes((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  async function saveHome(h: HomeState) {
    if (!authHeader) return;
    update(h.id, { saving: true, saved: false });

    const reqs: Promise<unknown>[] = [
      fetch(`/api/homes/${h.id}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: h.name, address: h.address }),
      }),
    ];

    const tariffPatch: Record<string, number> = {};
    if (h.energyRate !== "") tariffPatch.energy_rate_kwh = parseFloat(h.energyRate);
    if (h.powerRatePeak !== "") tariffPatch.power_rate_peak_kw_day = parseFloat(h.powerRatePeak);
    if (h.powerRateValley !== "") tariffPatch.power_rate_valley_kw_day = parseFloat(h.powerRateValley);

    if (Object.keys(tariffPatch).length > 0) {
      reqs.push(
        fetch(`/api/homes/${h.id}/tariff`, {
          method: "PUT",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(tariffPatch),
        })
      );
    }

    await Promise.all(reqs);
    update(h.id, { saving: false, saved: true });
    setTimeout(() => update(h.id, { saved: false }), 2000);
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {homes.map((h) => (
        <Card key={h.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              {h.name}
            </CardTitle>
            <CardDescription>{h.address || t("noAddress")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Home details */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <HomeIcon className="h-3.5 w-3.5" /> {t("homeDetails")}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${h.id}`}>{t("name")}</Label>
                  <Input
                    id={`name-${h.id}`}
                    value={h.name}
                    onChange={(e) => update(h.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`addr-${h.id}`}>{t("address")}</Label>
                  <Input
                    id={`addr-${h.id}`}
                    value={h.address}
                    onChange={(e) => update(h.id, { address: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Tariff rates */}
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <ZapIcon className="h-3.5 w-3.5" /> {t("tariffRates")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("tariffHint")}
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`rate-${h.id}`}>{t("energyRate")}</Label>
                  <Input
                    id={`rate-${h.id}`}
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="e.g. 0.19"
                    value={h.energyRate}
                    onChange={(e) => update(h.id, { energyRate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`peak-${h.id}`}>{t("p1PowerRate")}</Label>
                  <Input
                    id={`peak-${h.id}`}
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.102811"
                    value={h.powerRatePeak}
                    onChange={(e) => update(h.id, { powerRatePeak: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`valley-${h.id}`}>{t("p2PowerRate")}</Label>
                  <Input
                    id={`valley-${h.id}`}
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.047511"
                    value={h.powerRateValley}
                    onChange={(e) => update(h.id, { powerRateValley: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button onClick={() => saveHome(h)} disabled={h.saving}>
                {h.saving ? (
                  t("saving")
                ) : h.saved ? (
                  <><CheckIcon className="h-4 w-4" /> {t("saved")}</>
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {homes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <HomeIcon className="h-10 w-10 opacity-25" />
          <p className="text-sm">{t("noHomes")}</p>
        </div>
      )}
    </div>
  );
}
