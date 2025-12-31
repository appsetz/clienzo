"use client";

import { useEffect, useRef } from "react";
import type React from "react";

interface LayeredTextProps {
  lines?: Array<{ top: string; bottom: string }>;
  fontSize?: string;
  fontSizeMd?: string;
  lineHeight?: number;
  lineHeightMd?: number;
  className?: string;
}

export function LayeredText({
  lines = [
    { top: "\u00A0", bottom: "CLIENT" },
    { top: "CLIENT", bottom: "MANAGEMENT" },
    { top: "MANAGEMENT", bottom: "SIMPLIFIED" },
    { top: "SIMPLIFIED", bottom: "PROJECTS" },
    { top: "PROJECTS", bottom: "TRACKED" },
    { top: "TRACKED", bottom: "PAYMENTS" },
    { top: "PAYMENTS", bottom: "ORGANIZED" },
    { top: "ORGANIZED", bottom: "GROWTH" },
    { top: "GROWTH", bottom: "SUCCESS" },
    { top: "SUCCESS", bottom: "\u00A0" },
  ],
  fontSize = "72px",
  fontSizeMd = "36px",
  lineHeight = 60,
  lineHeightMd = 35,
  className = "",
}: LayeredTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);

  const calculateTranslateX = (index: number) => {
    const baseOffset = 35;
    const baseOffsetMd = 20;
    const centerIndex = Math.floor(lines.length / 2);
    return {
      desktop: (index - centerIndex) * baseOffset,
      mobile: (index - centerIndex) * baseOffsetMd,
    };
  };

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    let cleanup: (() => void) | undefined;

    const initAnimation = async () => {
      try {
        const gsapModule = await import("gsap");
        const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
        const container = containerRef.current;
        if (!container || !gsap) return;

        const paragraphs = container.querySelectorAll("p");
        if (paragraphs.length === 0) return;

        if (gsap.timeline) {
          timelineRef.current = gsap.timeline({ paused: true });

          timelineRef.current.to(paragraphs, {
            y: window.innerWidth >= 768 ? -60 : -35,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.08,
          });

          const handleMouseEnter = () => {
            timelineRef.current?.play();
          };

          const handleMouseLeave = () => {
            timelineRef.current?.reverse();
          };

          container.addEventListener("mouseenter", handleMouseEnter);
          container.addEventListener("mouseleave", handleMouseLeave);

          cleanup = () => {
            container.removeEventListener("mouseenter", handleMouseEnter);
            container.removeEventListener("mouseleave", handleMouseLeave);
            if (timelineRef.current) {
              timelineRef.current.kill();
            }
          };
        }
      } catch (error) {
        console.warn("GSAP animation not available, text will still display:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initAnimation();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className={`mx-auto py-24 font-sans font-black tracking-[-2px] uppercase text-white antialiased cursor-pointer ${className}`}
      style={{ fontSize, "--md-font-size": fontSizeMd } as React.CSSProperties}
    >
      <ul className="list-none p-0 m-0 flex flex-col items-center">
        {lines.map((line, index) => {
          const translateX = calculateTranslateX(index);
          return (
            <li
              key={index}
              className={`
                overflow-hidden relative
                ${
                  index % 2 === 0
                    ? "[transform:skew(60deg,-30deg)_scaleY(0.66667)]"
                    : "[transform:skew(0deg,-30deg)_scaleY(1.33333)]"
                }
              `}
              style={
                {
                  height: `${lineHeight}px`,
                  transform: `translateX(${translateX.desktop}px) skew(${index % 2 === 0 ? "60deg, -30deg" : "0deg, -30deg"}) scaleY(${index % 2 === 0 ? "0.66667" : "1.33333"})`,
                  "--md-height": `${lineHeightMd}px`,
                  "--md-translateX": `${translateX.mobile}px`,
                } as React.CSSProperties
              }
            >
              <p
                className="leading-[55px] md:leading-[30px] px-[15px] align-top whitespace-nowrap m-0"
                style={
                  {
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight - 5}px`,
                  } as React.CSSProperties
                }
              >
                {line.top}
              </p>
              <p
                className="leading-[55px] md:leading-[30px] px-[15px] align-top whitespace-nowrap m-0"
                style={
                  {
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight - 5}px`,
                  } as React.CSSProperties
                }
              >
                {line.bottom}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
