"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import { ImagePlus } from "lucide-react";

type ImageDropzoneProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onFileDrop: (file: File) => void;
};

export function ImageDropzone({
  children,
  className = "",
  disabled = false,
  onFileDrop,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (disabled || !Array.from(event.dataTransfer.types).includes("Files")) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }
    setIsDragging(false);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled || !Array.from(event.dataTransfer.types).includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) {
      return;
    }

    const file = event.dataTransfer.files.item(0);
    if (file) {
      onFileDrop(file);
    }
  }

  return (
    <div
      className={`relative rounded-xl transition-colors duration-200 hover:bg-orange-50/30 ${
        isDragging ? "bg-orange-50 ring-4 ring-[#e96a32]/25" : ""
      } ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-xl bg-[#08162d]/65 p-4 text-center text-sm font-extrabold text-white backdrop-blur-[2px]"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
            <ImagePlus className="size-5" />
            Drop image here
          </span>
        </div>
      )}
    </div>
  );
}
