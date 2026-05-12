export type GuideStep = {
  title: string;
  description: string;
};

export type Guide = {
  name: string;
  steps: GuideStep[];
};
