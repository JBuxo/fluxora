import type { ConsumptionReport, Distributor } from "@/lib/types/ui";

export const reports: ConsumptionReport[] = [
  { name: "Report 1", url: "#", date: new Date(2025, 1, 15) },
  { name: "Report 2", url: "#", date: new Date(2024, 2, 16) },
  { name: "Report 3", url: "#", date: new Date(2024, 9, 17) },
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
