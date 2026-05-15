import { Guide } from "@/lib/types/ui";
import Image from "next/image";

export default function GuideComponent({ guide }: { guide: Guide }) {
  return (
    <div className="mt-6 space-y-16">
      {guide.steps.map((step, idx) => (
        <div key={idx} className="grid grid-cols-1 lg:grid-cols-5 gap-x-8">
          <div className="my-auto lg:col-span-2">
            <h3 className="font-medium text-lg">
              {idx + 1}. {step.title}
            </h3>

            <p className="text-muted-foreground text-pretty">
              {step.description}
            </p>
          </div>

          <div className="w-full lg:col-span-3">
            {step.imgUrl && (
              <Image
                src={step.imgUrl}
                alt={step.title}
                width={600}
                height={300}
                className="rounded-md border object-cover w-full h-auto"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
