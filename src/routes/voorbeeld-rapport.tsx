import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wrap } from "@/components/site-shell";
import { FitDocument } from "@/components/fit-document";
import { SAMPLE_LEAD } from "@/lib/matchdesk";

export const Route = createFileRoute("/voorbeeld-rapport")({ component: SampleReport });

function SampleReport() {
  return (
    <main className="bg-paper py-12 text-ink print:py-0">
      <Wrap className="max-w-3xl">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">Fictief voorbeeld · nieuwe verkoop gepauzeerd</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">Zo ziet het Fit-rapport eruit</h1>
        <p className="mt-3 max-w-xl text-muted">
          Fictief dossier als voorbeeld. Nieuwe verkoop is gepauzeerd. Voor bestaande aankopen blijft de overeengekomen levering gelden; dit voorbeeld bevat geen echte klantgegevens.
        </p>
        <div className="my-8 print:hidden">
          <Button type="button" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </div>
        <FitDocument lead={SAMPLE_LEAD} sample />
      </Wrap>
    </main>
  );
}
