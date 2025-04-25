import {
  Squares2X2Icon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  CloudIcon,
} from '@heroicons/react/24/solid';
import clsx from "clsx";

interface TabHeaderProps {
  activeTab: 'tables' | 'operations' | 'query' | 'database' | 'cloud';
  setActiveTab: (tab: 'tables' | 'operations' | 'query' | 'database' | 'cloud') => void;
  totalUnreadOperations?: number;
  className?: string;
  isCloud?: boolean;
}

const TabHeader = ({ isCloud, activeTab, setActiveTab, totalUnreadOperations, className }: TabHeaderProps) => {
  return (
    <div className={clsx([
      "flex gap-2 px-3 mb-1",
      className,
    ])}>
      <button
        className={`flex items-center transition rounded duration-100 px-3 py-1 ${
          activeTab === 'tables' ? 'bg-gray-700' : 'bg-gray-600'
        }`}
        onClick={() => setActiveTab('tables')}
      >
        <Squares2X2Icon className="h-5 w-5 mr-2" />
        Tables
      </button>
      <button
        className={`flex items-center transition rounded duration-100 px-3 py-1 ${
          activeTab === 'operations' ? 'bg-gray-700' : 'bg-gray-600'
        }`}
        onClick={() => setActiveTab('operations')}
      >
        <Cog6ToothIcon className="h-5 w-5 mr-2" />
        Operations {totalUnreadOperations > 0 &&
          <span className={'ml-1 rounded-full bg-gray-700 w-[1.4rem] h-[1.4rem] pb-[1px] text-xs font-bold flex justify-center items-center'}>{totalUnreadOperations}</span>}
      </button>
      <button
        className={`flex items-center transition rounded duration-100 px-3 py-1 ${
          activeTab === 'query' ? 'bg-gray-700' : 'bg-gray-600'
        }`}
        onClick={() => setActiveTab('query')}
      >
        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
        Query
      </button>
      <button
        className={`flex items-center transition rounded duration-100 px-3 py-1 ${
          activeTab === 'database' ? 'bg-gray-700' : 'bg-gray-600'
        }`}
        onClick={() => setActiveTab('database')}
      >
        <ServerIcon className="h-5 w-5 mr-2" />
        Database
      </button>
      {isCloud && <button
        className={`flex items-center transition rounded duration-100 px-3 py-1 ${
          activeTab === 'cloud' ? 'bg-gray-700' : 'bg-gray-600'
        }`}
        onClick={() => setActiveTab('cloud')}
      >
        <CloudIcon className="h-5 w-5 mr-2"/>
        Cloud
      </button>}
    </div>
  );
};

export default TabHeader;
