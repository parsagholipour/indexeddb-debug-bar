import React, {useCallback, useEffect, useState} from "react";
import OverviewTab from "./../cloud/OverviewTab";
import ActionsTab from "./../cloud/ActionsTab";
import StatsTab from "./../cloud/StatsTab";
import EventLogTab from "./../cloud/EventLogTab";
import DiagnosticsTab from "./../cloud/DiagnosticsTab";
import DebugToolsTab from "./../cloud/DebugToolsTab";
import {
  CloudIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import Dexie from "dexie";
import {SyncEvent} from "../../common/SyncEvent.ts";

export interface LogEntry {
  date: Date;
  message: string;
}

interface DexieCloudDebugProps {
  db: Dexie;
  syncEvents: SyncEvent[];
}

const DexieCloudDebug: React.FC<DexieCloudDebugProps> = ({ db, syncEvents }) => {
  const dexieCloud = db.cloud;
  const tabs: string[] = [
    "overview",
    "actions",
    "stats",
    "eventLog",
    "diagnostics",
    "debugTools",
  ];
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newEventsCount, setNewEventsCount] = useState<number>(0);
  // Track previous syncEvents length to know how many new ones arrived.
  const [prevSyncEventsCount, setPrevSyncEventsCount] = useState<number>(syncEvents.length);

  // Global log function to be used by child components.
  const addLog = useCallback((msg: string): void => {
    setLogs((prev) => [{ date: new Date(), message: msg }, ...prev]);
    // Increment newEventsCount only if not viewing the eventLog tab.
    if (activeTab !== "eventLog") {
      setNewEventsCount((count) => count + 1);
    }
  }, [activeTab]);

  // Listen for changes in syncEvents.
  useEffect(() => {
    if (activeTab !== "eventLog") {
      const newSyncEvents = syncEvents.length - prevSyncEventsCount;
      if (newSyncEvents > 0) {
        setNewEventsCount((count) => count + newSyncEvents);
      }
    }
    setPrevSyncEventsCount(syncEvents.length);
  }, [syncEvents, activeTab, prevSyncEventsCount]);

  // Mapping from tab names to Heroicons.
  const tabIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    overview: CloudIcon,
    actions: Cog6ToothIcon,
    stats: InformationCircleIcon,
    eventLog: ClipboardDocumentListIcon,
    diagnostics: ExclamationTriangleIcon,
    debugTools: WrenchScrewdriverIcon,
  };

  const changeTab = (tab: string): void => {
    setActiveTab(tab);
    if (tab === "eventLog") {
      setNewEventsCount(0);
    }
  };

  return (
    <div className="py-1">
      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => {
          const IconComponent = tabIcons[tab];
          return (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className={`flex items-center px-4 py-2 rounded ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {IconComponent && <IconComponent className="h-5 w-5 mr-2" />}
              {tab === "eventLog"
                ? `Event Log${newEventsCount > 0 ? ` (${newEventsCount})` : ""}`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Render active tab */}
      {activeTab === "overview" && <OverviewTab dexieCloud={dexieCloud} />}
      {activeTab === "actions" && <ActionsTab addLog={addLog} />}
      {activeTab === "stats" && <StatsTab />}
      {activeTab === "eventLog" && <EventLogTab manualLogs={logs} syncEvents={syncEvents} />}
      {activeTab === "diagnostics" && <DiagnosticsTab />}
      {activeTab === "debugTools" && <DebugToolsTab />}
    </div>
  );
};

export default DexieCloudDebug;
