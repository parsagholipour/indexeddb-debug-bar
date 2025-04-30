"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function TruncatableText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsOverflow(el.scrollWidth > el.clientWidth);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div ref={containerRef} className="max-w-[200px] truncate">
        {text}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && isOverflow && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-full left-1/2 mb-2 z-10 w-[300px] max-h-[60px] overflow-y-auto whitespace-pre-wrap break-words rounded bg-gray-700 border-gray-400 border px-3 py-0 text-sm text-white shadow-xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
