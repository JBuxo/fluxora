export type GuideStep = {
  title: string;
  description: string;
  imgUrl?: string;
};

export type Guide = {
  name: string;
  steps: GuideStep[];
};
