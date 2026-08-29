import WindRose from "@/components/WindRose";
import SunPathTool from "@/components/SunPathTool";
import PageHeader from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Daa'ist - Tools",
  description:
    "Site analysis generators for studio work: wind rose and sun path diagrams.",
};

const TOOLS = [
  {
    value: "windrose",
    name: "Wind rose",
    does: "Plots wind direction and speed frequency for a location.",
    render: () => <WindRose />,
  },
  {
    value: "sunpath-2d",
    name: "Sun path, 2D",
    does: "Stereographic sun path diagram for a latitude and date range.",
    render: () => <SunPathTool variant="2d" />,
  },
  {
    value: "sunpath-3d",
    name: "Sun path, 3D",
    does: "The same solar geometry, drawn on a hemisphere.",
    render: () => <SunPathTool variant="3d" />,
  },
];

function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader
        title="Tools"
        lede="Site analysis generators for studio work. Enter a location, take the diagram."
        meta={`${TOOLS.length} tools`}
      />

      <Accordion
        type="single"
        collapsible
        defaultValue="windrose"
        className="mt-10"
      >
        {TOOLS.map((tool) => (
          <AccordionItem
            key={tool.value}
            value={tool.value}
            className="rule-t border-b-0"
          >
            <AccordionTrigger className="py-6 hover:no-underline">
              <span className="flex flex-col items-start gap-1 text-left">
                <span className="text-xl font-bold sm:text-2xl">
                  {tool.name}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {tool.does}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-10">
              {tool.render()}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="rule-t" />
    </main>
  );
}

export default ToolsPage;
