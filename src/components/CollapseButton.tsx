import { ChevronUpIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import clsx from "clsx";

const CollapseButton = ({ isCollapsed, setIsCollapsed, orientation, isLeft }) => {
  return (
    <button
      className={clsx([
        'text-sm active:scale-95 hover:text-gray-300 bg-gray-600 flex items-center justify-center px-2 py-1 rounded',
      ])}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
        {isCollapsed ? <ChevronUpIcon className={clsx([
          isLeft && orientation === 'vertical' && 'transform rotate-[90deg]',
        (!isLeft && orientation === 'vertical') ? 'transform rotate-[-90deg]' : '',
        ])} width={22} height={22} />: <ChevronDownIcon className={clsx([
          !isLeft && orientation === 'vertical' ? 'transform rotate-[-90deg]' : '',
          isLeft && orientation === 'vertical' && 'transform rotate-[90deg]',
        ])} width={22} height={22} />}
    </button>
  );
};

export default CollapseButton;
