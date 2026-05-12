import { Guide } from "@/types/guide";

export default function GuideComponent({ guide }: { guide: Guide }) {
  return (
    <div className="mt-6 space-y-4">
      {guide.steps.map((step, idx) => (
        <div key={idx} className="p-4 rounded-md border bg-muted/40">
          <h3 className="font-medium">
            {idx + 1}. {step.title}
          </h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
