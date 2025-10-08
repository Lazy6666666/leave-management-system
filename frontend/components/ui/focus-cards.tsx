"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface CardProps {
  title: string;
  src: string;
  description?: string;
  className?: string;
}

export const Card = React.memo(
  ({
    title,
    src,
    description,
    className,
    onMouseEnter,
    onMouseLeave,
  }: CardProps & {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }) => (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "relative h-60 w-full overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 ease-out dark:bg-neutral-900 md:h-96",
        className
      )}
    >
      <img
        src={src}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={cn(
          "absolute inset-0 flex items-end bg-black/50 px-4 py-8 transition-opacity duration-300",
          onMouseEnter ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="bg-gradient-to-b from-neutral-50 to-neutral-200 bg-clip-text text-xl font-medium text-transparent md:text-2xl">
          {title}
        </div>
      </div>
    </div>
  )
);

Card.displayName = "Card";

export function FocusCards({
  cards = [],
  children,
  className,
}: {
  cards?: CardProps[];
  children: React.ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-3 md:px-8",
        className
      )}
    >
      {cards.map((card, index) => (
        <Card
          key={index}
          {...card}
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            hovered !== null &&
              hovered !== index &&
              "scale-[0.98] blur-sm transition-all duration-300"
          )}
        />
      ))}
      {children}
    </div>
  );
}
