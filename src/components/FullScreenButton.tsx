import React from 'react';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

interface FullScreenButtonProps {
  isFullScreen: boolean;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FullScreenButton({
                                           isFullScreen,
                                           setIsFullScreen,
                                           setIsCollapsed,
                                         }: FullScreenButtonProps) {
  return (
    <button
      className="text-sm active:scale-95 justify-center bg-gray-600 px-2 py-1 rounded text-white hover:text-gray-300 flex items-center"
      onClick={() => {
        setIsFullScreen(!isFullScreen)
        if (!isFullScreen)
          setIsCollapsed(false)
        else
          setIsCollapsed(true)
      }}
      title={isFullScreen ? "Exit Fullscreen" : "Go Fullscreen"}
    >
      {isFullScreen ? (
        <ArrowsPointingInIcon className="h-6 w-6" />
      ) : (
        <ArrowsPointingOutIcon className="h-6 w-6" />
      )}
    </button>
  );
}
