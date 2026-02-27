import WindRose from "@/components/WindRose";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function ToolsPage() {
  return (
    <main className="relative min-h-screen w-full bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 md:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Useful Tools</h1>

          <Accordion
            type="single"
            collapsible
            defaultValue="windrose"
            className="mt-6 rounded-2xl border border-border/60 bg-background/50 px-4"
          >
            <AccordionItem value="windrose">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Windrose Generator
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <WindRose />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="solar-path">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Solar Path (Coming Soon)
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">Coming Soon.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sun-hours">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Sun Hours (Coming Soon)
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">Coming Soon.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
}

export default ToolsPage;
