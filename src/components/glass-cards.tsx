"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function LiquidGlassCard({
  children,
  className = "",
  color = "rgba(255, 255, 255, 0.5)",
}: GlassCardProps) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "24px",
        isolation: "isolate",
      }}
      className={`relative ${className}`}
    >
      {/* Subtle White Glass Border Effect */}
      <div
        style={{
          position: "absolute",
          inset: "-3px",
          borderRadius: "27px",
          padding: "3px",
          background: `conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.5) 60deg,
            rgba(255, 255, 255, 0.25) 120deg,
            transparent 180deg,
            rgba(255, 255, 255, 0.35) 240deg,
            transparent 360deg
          )`,
          zIndex: -1,
        }}
      />

      {/* Main Liquid Glass Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "24px",
          background: `
            linear-gradient(145deg, 
                rgba(255, 255, 255, 0.22), 
                rgba(255, 255, 255, 0.08)
            )
          `,
          backdropFilter: "blur(25px) saturate(180%)",
          WebkitBackdropFilter: "blur(25px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.35),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 0 rgba(255, 255, 255, 0.15)
          `,
          overflow: "hidden",
        }}
        className="p-6 text-slate-900"
      >
        {/* Enhanced Glass reflection overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60%",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.12) 50%, transparent 100%)",
            pointerEvents: "none",
            borderRadius: "24px 24px 0 0",
          }}
        />

        {/* Glass shine effect */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            right: "10px",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)",
            borderRadius: "1px",
            pointerEvents: "none",
          }}
        />

        {/* Side glass reflection */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "2px",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%)",
            borderRadius: "24px 0 0 24px",
            pointerEvents: "none",
          }}
        />

        {/* Frosted glass texture */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 1px, transparent 2px),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 1px, transparent 2px),
              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.08) 1px, transparent 2px)
            `,
            backgroundSize: "30px 30px, 25px 25px, 35px 35px",
            pointerEvents: "none",
            borderRadius: "24px",
            opacity: 0.7,
          }}
        />

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

interface CardProps {
  id: number;
  title: string;
  description: string;
  index: number;
  totalCards: number;
  color: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ index, totalCards, color, children, title, description }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const targetScale = 1 - (totalCards - index) * 0.05;

    gsap.set(card, {
      scale: 1,
      transformOrigin: "center top",
    });

    ScrollTrigger.create({
      trigger: container,
      start: "top center",
      end: "bottom center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const scale = gsap.utils.interpolate(1, targetScale, progress);

        gsap.set(card, {
          scale: Math.max(scale, targetScale),
          transformOrigin: "center top",
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [index, totalCards]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        ref={cardRef}
        style={{
          position: "relative",
          width: "70%",
          height: "450px",
          borderRadius: "24px",
          isolation: "isolate",
          top: `calc(-5vh + ${index * 25}px)`,
          transformOrigin: "top",
        }}
        className="card-content"
      >
        <div
          style={{
            position: "absolute",
            inset: "-3px",
            borderRadius: "27px",
            padding: "3px",
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              ${color} 60deg,
              ${color.replace("0.8", "0.6")} 120deg,
              transparent 180deg,
              ${color.replace("0.8", "0.4")} 240deg,
              transparent 360deg
            )`,
            zIndex: -1,
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRadius: "24px",
            background: `
              linear-gradient(145deg, 
                  rgba(255, 255, 255, 0.1), 
                  rgba(255, 255, 255, 0.05)
              )
            `,
            backdropFilter: "blur(25px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "60%",
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
              pointerEvents: "none",
              borderRadius: "24px 24px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              right: "10px",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)",
              borderRadius: "1px",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "2px",
              height: "100%",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)",
              borderRadius: "24px 0 0 24px",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 2px),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 1px, transparent 2px),
                radial-gradient(circle at 40% 80%, rgba(255,255,255,0.06) 1px, transparent 2px)
              `,
              backgroundSize: "30px 30px, 25px 25px, 35px 35px",
              pointerEvents: "none",
              borderRadius: "24px",
              opacity: 0.7,
            }}
          />
          <div className="relative z-10 p-8">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-slate-200">{description}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
