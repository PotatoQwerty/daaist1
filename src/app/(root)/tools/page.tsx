import WindRose from "@/components/WindRose";
import SunPathTool from "@/components/SunPathTool";
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

            <AccordionItem value="sunpath-2d">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Sun Path 2D Generator
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <SunPathTool variant="2d" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sunpath-3d">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Sun Path 3D Generator
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <SunPathTool variant="3d" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
}

export default ToolsPage;
