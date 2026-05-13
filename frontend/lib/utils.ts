import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withContractParam(pathname: string, contractId: string) {
  const params = new URLSearchParams();

  params.set("c", contractId);

  return `${pathname}?${params.toString()}`;
}
