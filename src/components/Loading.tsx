import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AnimatedSVG() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const paths = svgRef.current?.querySelectorAll(".draw-me");

    if (!paths) return;

    paths.forEach((path, i) => {
      const length = (path as SVGPathElement).getTotalLength();

      // Set initial styles
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        fill: "none",
        transformOrigin: "center center",
        scale: 1,
      });

      // Create timeline per path
      const tl = gsap.timeline({
        delay: i * 0.3, // stagger each path
      });

      tl.to(path, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.inOut",
      })
        // fill after stroke animation completes
        .to(
          path,
          {
            fill: (path as SVGPathElement).style.stroke, // use stroke color
            duration: 0.6,
            ease: "power1.inOut",
          },
          "+=0.1"
        )
        // bounce scale animation
        .to(path, {
          scale: 1.1,
          duration: 0.3,
          ease: "power1.inOut",
        })
        .to(path, {
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.5)",
        });
    });
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        data-name="Layer 2"
        viewBox="0 0 373 447.59"
        style={{ width: "300px", height: "auto" }}
      >
        <g data-name="Layer 1">
          <path
            className="draw-me"
            d="M0 447.59V0c115.31 2.33 208.1 101.63 208.1 223.8S115.31 445.27 0 447.59Z"
            style={{
              stroke: "#233e95",
              strokeWidth: "3px",
              fill: "none",
            }}
          />
          <path
            className="draw-me"
            d="M373 239.54V447.6H166.87c2.12-115.32 92.7-208.1 204.17-208.1.67 0 1.3 0 1.96.04Z"
            style={{
              stroke: "#ed2024",
              strokeWidth: "3px",
              fill: "none",
            }}
          />
          <path
            className="draw-me"
            d="M373 2.54V210.6c-1.14.04-2.32.04-3.46.04-111.47-.79-201.42-94.15-202.76-209.47l206.21 1.37Z"
            style={{
              stroke: "#ffca3f",
              strokeWidth: "3px",
              fill: "none",
            }}
          />
          <circle
            className="draw-me"
            cx={251.29}
            cy={223.79}
            r={23.56}
            style={{
              stroke: "#231f20",
              strokeWidth: "3px",
              fill: "none",
            }}
          />
        </g>
      </svg>
    </div>
  );
}
