import { Contract } from "@/types/contract";
import { ConsumptionReport } from "@/types/consumption-report";
import {
  AudioLinesIcon,
  GalleryVerticalEndIcon,
  TerminalIcon,
} from "lucide-react";
import { Distributor } from "@/types/distributor";
import { KPI } from "@/types/analytics";

export const contracts: Contract[] = [
  {
    name: "Casa Marbella",
    logo: GalleryVerticalEndIcon,
    tariff: "2.0TD",
    id: "4c4c071b-d425-4f22-94b7-7f9df5925c18",
  },
  {
    name: "Casa Madrid",
    logo: AudioLinesIcon,
    tariff: "2.0TD",
    id: "ecb3f1c0-1d4a-4f2e-9d4a-1c3e5f7g9h1i",
  },
  {
    name: "Casa Malaga",
    logo: TerminalIcon,
    tariff: "2.0TD",
    id: "f2d4e5f6-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
  },
];

export const reports: ConsumptionReport[] = [
  {
    name: "Report 1",
    url: "#",
    date: new Date(2025, 1, 15),
  },
  {
    name: "Report 2",
    url: "#",
    date: new Date(2024, 2, 16),
  },
  {
    name: "Report 3",
    url: "#",
    date: new Date(2024, 9, 17),
  },
];

export const supportedDistributors: Distributor[] = [
  {
    id: "1",
    name: "Iberdrola",
    portalUrl: "https://www.iberdrola.com/",
    logoUrl:
      "https://cdn.brandfetch.io/idT1rVLMgZ/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1687779114181",
  },
  {
    id: "2",
    name: "Endesa",
    portalUrl: "https://www.endesaclientes.com/",
    logoUrl:
      "https://cdn.brandfetch.io/idnCojsLlg/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1667822557969",
  },
  {
    id: "3",
    name: "Naturgy",
    portalUrl: "https://www.naturgy.com/",
    logoUrl:
      "https://cdn.brandfetch.io/idsrKBdQQF/w/202/h/56/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1773467012288",
  },
];

export const kpis: KPI[] = [
  {
    title: "Total Consumption",
    description: "Selected period",
    value: "10.2 MWh",
    hint: "Derived from uploaded historical reports",
  },
  {
    title: "Consumption Trend",
    description: "vs previous period",
    value: "+5.3%",
    hint: "Based on historical comparison",
  },
  {
    title: "Total Cost",
    description: "Selected period",
    value: "€1,240",
    hint: "Aggregated from distributor reports",
  },
  {
    title: "Forecasted Cost",
    description: "End of period estimate",
    value: "€1,380",
    hint: "Projected from historical trends",
  },
];
