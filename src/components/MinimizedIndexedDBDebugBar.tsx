import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {CircleStackIcon} from "@heroicons/react/24/outline";

export default function MinimizedIndexedDBDebugBar({ toggle }) {
  const [minimizedPosition, setMinimizedPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const minimizedCircleRef = useRef<HTMLDivElement>(null);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimizedCircleRef.current) return;
    setIsDragging(true);
    const rect = minimizedCircleRef.current.getBoundingClientRect();
    setDragStartOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    if (!hasDragged) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setHasDragged(true);
      }
    }

    const newX = e.clientX - dragStartOffset.x;
    const newY = e.clientY - dragStartOffset.y;
    const circleSize = minimizedCircleRef.current?.offsetWidth || 48;

    setMinimizedPosition({
      x: Math.max(0, Math.min(newX, window.innerWidth - circleSize)),
      y: Math.max(0, Math.min(newY, window.innerHeight - circleSize))
    });
  }, [isDragging, dragStartOffset, hasDragged]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!minimizedCircleRef.current) return;
    setIsDragging(true);
    const rect = minimizedCircleRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragStartOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];

    if (!hasDragged) {
      const dx = touch.clientX - dragStartPos.current.x;
      const dy = touch.clientY - dragStartPos.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setHasDragged(true);
      }
    }

    const newX = touch.clientX - dragStartOffset.x;
    const newY = touch.clientY - dragStartOffset.y;
    const circleSize = minimizedCircleRef.current?.offsetWidth || 48;

    setMinimizedPosition({
      x: Math.max(0, Math.min(newX, window.innerWidth - circleSize)),
      y: Math.max(0, Math.min(newY, window.innerHeight - circleSize))
    });
  }, [isDragging, dragStartOffset, hasDragged]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Touch events
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleClick = useCallback(() => {
    if (!hasDragged) {
      toggle();
    }
    setHasDragged(false);
  }, [hasDragged, toggle]);

  return (
    <div
      ref={minimizedCircleRef}
      className={clsx(
        "fixed z-[60] w-12 h-12 bg-gray-800 transition-all duration-200 shadow-sm shadow-white border-white rounded-full",
        "flex items-center justify-center cursor-grab hover:bg-blue-900",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: `${minimizedPosition.x}px`,
        top: `${minimizedPosition.y}px`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      title="IndexedDB Debug Bar"
    >
      <CircleStackIcon className="text-white h-6 w-6"/>
    </div>
  );
}
