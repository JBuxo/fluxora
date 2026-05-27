import type { ElementType } from "react";

export interface Contract {
  id: string;
  name: string;
  tariff: string;
  logo: ElementType;
}

export interface Anomaly {
  date: string;
  deviation: number;
  reason: string;
}

export interface ConsumptionReport {
  id?: string;
  name: string;
  url: string;
  date: Date;
}

export interface Distributor {
  id: string;
  name: string;
  portalUrl: string;
  logoUrl: string;
}

export interface GuideStep {
  title: string;
  description?: string;
  imgUrl?: string;
}

export interface Guide {
  name: string;
  steps: GuideStep[];
}
