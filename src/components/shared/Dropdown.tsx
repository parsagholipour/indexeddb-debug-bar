import React, { useState, useRef, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  // Fallback height in case the menu isn't rendered yet.
  const defaultMenuHeight = 150;

  const calculatePosition = (menuHeight: number) => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      let top = triggerRect.bottom;
      // If there isn’t enough space below, position above the trigger.
      if (spaceBelow < menuHeight) {
        top = triggerRect.top - menuHeight;
      }
      setPosition({ top, left: triggerRect.left });
    }
  };

  const handleButtonClick = () => {
    // First calculate position using the default menu height.
    calculatePosition(defaultMenuHeight);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <>
        <Menu.Button ref={triggerRef} onClick={handleButtonClick}>
          {trigger}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
          // After the dropdown is rendered, measure its height and update the position.
          beforeEnter={() => {
            if (menuRef.current) {
              const measuredHeight = menuRef.current.offsetHeight;
              calculatePosition(measuredHeight);
            }
          }}
          beforeLeave={() => {
            if (menuRef.current) {
              const measuredHeight = menuRef.current.offsetHeight;
              calculatePosition(measuredHeight);
            }
          }}
        >
          <Menu.Items
            modal={false}
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="fixed w-40 origin-top-right bg-gray-800 divide-y divide-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          >
            {children}
          </Menu.Items>
        </Transition>
      </>
    </Menu>
  );
};

export default Dropdown;
