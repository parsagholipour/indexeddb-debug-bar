import React, { useState, useRef, useEffect } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import DockIcon from "./icons/DockIcon";

type PositionValue = 'top' | 'bottom' | 'left' | 'right';
const positions: PositionValue[] = ['top', 'bottom', 'left', 'right'];


interface PositionDropdownProps {
  value: PositionValue;
  onChange: (value: PositionValue) => void;
  minimized?: boolean;
}

const DROPDOWN_MAX_HEIGHT_PX = 240;
const BOTTOM_MARGIN_BUFFER = 20; // Extra space to keep from edge

const PositionDropdown: React.FC<PositionDropdownProps> = ({ value, onChange, minimized }) => {
  const [openUpwards, setOpenUpwards] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const checkPosition = (isOpen: boolean) => {
    // Only run the check if the dropdown is open and the button ref is available
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;

      // If space below is less than dropdown height + buffer, open upwards
      setOpenUpwards(spaceBelow < DROPDOWN_MAX_HEIGHT_PX + BOTTOM_MARGIN_BUFFER);
    }
  };

  return (
    // Use the render prop pattern to get the 'open' state from Listbox
    <Listbox value={value} onChange={onChange}>
      {({ open }) => {
        useEffect(() => {
          checkPosition(open);
          const handleResize = () => checkPosition(open);
          if (open) {
            window.addEventListener('resize', handleResize);
          }
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }, [open]); // Dependency array ensures this runs when 'open' changes

        return (
          // Ensure the container has position: relative
          <div className="relative"> {/* Removed mt-1, handle margin below */}
            <Listbox.Button
              ref={buttonRef} // Attach the ref here
              className={clsx(
                ["relative w-full flex justify-center cursor-default rounded-lg bg-gray-800 py-2 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"],
                !minimized ? 'pl-3 pr-8' : 'px-2',
              )}
            >
              <DockIcon variant={value} />
              {!minimized && <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true"/>
              </span>}
            </Listbox.Button>

            {/* Use `static` prop if you want to always render options for measurement,
                or Transition for animations. For simplicity, we'll conditionally style. */}
            <Listbox.Options
              modal={false}
              className={clsx(
                "absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
                // Conditional positioning classes
                openUpwards
                  ? 'bottom-full mb-1' // Position above the button, add margin-bottom
                  : 'mt-1'            // Position below the button (default), add margin-top
              )}
            >
              {positions.map((pos) => (
                <Listbox.Option
                  key={pos}
                  value={pos}
                  className={({ active }) =>
                    clsx(
                      'cursor-default select-none relative py-2 flex justify-center',
                      active ? 'bg-blue-800 text-white' : 'text-gray-300'
                    )
                  }
                >
                  <span className={clsx(
                    'block truncate capitalize',
                    value === pos ? 'font-medium text-blue-400' : 'font-normal' // Highlight selected based on parent value
                  )}>
                    <DockIcon variant={pos} />
                  </span>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        );
      }}
    </Listbox>
  );
};

export default PositionDropdown;
