import {useEffect, useState} from 'react';
import TabHeader from './components/TabHeader';
import Tables from "./components/tabs/Tables";
import OperationsList from "./components/tabs/OperationsList";
import QueryTab from "./components/tabs/QueryTab";
import DatabaseTab from "./components/tabs/DatabaseTab";
import CloudTab from "./components/tabs/CloudTab";
import IndexedDBDebugBarContext from "./contexts/IndexedDBDebugBarContext.tsx";
import clsx from "clsx";
import useWatchTransactions from "./hooks/useWatchTransactions";
import useWatchCloud from "./hooks/useWatchCloud";
import IndexedDBDebugProps from "./common/IndexedDBDebugProps.ts";
import Layout from "./common/Layout.ts";

const IndexedDBDebug = ({ db, _barProps }: IndexedDBDebugProps) => {
  if (!db) {
    console.warn('Database passed to indexeddb-debug-bar is undefined')
  }
  const layout: Layout = _barProps?.layout || {
    position: 'bottom' as 'top' | 'bottom' | 'left' | 'right',
    isCollapsed: false,
    isFullScreen: false,
    isMinimized: false,
  };
  const orientation = layout.position === 'left' || layout.position === 'right' ? 'vertical' : 'horizontal'
  const isCollapsed = layout.isCollapsed;

  const { operations, clearOperations } = useWatchTransactions(db);
  const {syncEvents} = useWatchCloud(db);
  const [activeTab, setActiveTab] = useState<'tables' | 'operations' | 'query' | 'database' | 'cloud'>('tables');
  const isCloud = !!db.cloud?.options;

  const [totalUnreadOperations, setTotalUnreadOperations] = useState(0)
  const [realTotalUnreadOperations, setRealTotalUnreadOperations] = useState(0)
  useEffect(() => {
    if (operations.length === 0) {
      setTotalUnreadOperations(0)
      setRealTotalUnreadOperations(0);
    } else {
      setTotalUnreadOperations(old => old + operations.length - realTotalUnreadOperations)
      setRealTotalUnreadOperations(operations.length);
    }
  }, [operations]);
  useEffect(() => {
    if (activeTab === 'operations') {
      setTotalUnreadOperations(0);
    }
  }, [activeTab]);

  return (
    <IndexedDBDebugBarContext.Provider value={{ db, isCloud }}>
      <div className={clsx([
        'contents',
        !_barProps && 'indexeddb-debug-bar'
      ])}>
          {!isCollapsed && (
            <div
              className={clsx(
                "flex-1 overflow-auto",
                orientation === 'vertical' ? 'flex-row' : 'flex-col'
              )}
            >
              <TabHeader
                totalUnreadOperations={totalUnreadOperations}
                isCloud={isCloud}
                className={orientation === 'vertical' ? 'sticky z-10 top-0 bg-gray-800 py-2 mb-[-0.5rem]' : ''}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              <div className="p-4">
                <div className={clsx([activeTab !== 'tables' && 'hidden'])}>
                  <Tables/>
                </div>
                <div className={clsx([activeTab !== 'operations' && 'hidden'])}>
                  <OperationsList clearOperations={clearOperations} operations={operations}/>
                </div>
                <div className={clsx([activeTab !== 'query' && 'hidden'])}>
                  <QueryTab
                    orientation={orientation}
                  />
                </div>
                {activeTab === 'database' && <DatabaseTab db={db}/>}
                {isCloud &&
                  <div className={clsx([activeTab !== 'cloud' && 'hidden'])}>
                  <CloudTab syncEvents={syncEvents} db={db}/>
                </div>
                }
              </div>
            </div>
          )}
      </div>
    </IndexedDBDebugBarContext.Provider>
  );
};

export default IndexedDBDebug;
