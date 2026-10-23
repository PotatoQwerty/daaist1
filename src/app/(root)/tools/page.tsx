import WindRose from "@/components/WindRose";
import SunPathTool from "@/components/SunPathTool";
import PageHeader from "@/components/PageHeader";
import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TOOLS_DESCRIPTION =
  "Site analysis generators for studio work: wind rose and sun path diagrams.";

export const metadata: Metadata = {
  title: "Tools",
  description: TOOLS_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/tools") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/tools"),
    title: `Tools | ${SITE_NAME}`,
    description: TOOLS_DESCRIPTION,
  },
};

const TOOLS = [
  {
    value: "windrose",
    name: "Wind rose",
    does: "Seasonal wind direction and speed frequencies for a station and year.",
    render: () => <WindRose />,
  },
  {
    value: "sunpath-2d",
    name: "Sun path, 2D",
    does: "True-north sun paths for representative March, summer and winter dates.",
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
