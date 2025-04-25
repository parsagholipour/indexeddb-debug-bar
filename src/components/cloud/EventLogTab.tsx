import React from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import {SyncEvent} from "../../common/SyncEvent.ts";
import {LogEntry} from "../tabs/CloudTab.tsx";

interface EventLogTabProps {
  syncEvents: SyncEvent[];
  manualLogs: LogEntry[];
}

const EventLogTab: React.FC<EventLogTabProps> = ({ syncEvents, manualLogs }) => {
  const allEvents = [...(syncEvents || []), ...(manualLogs || [])].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  })
  const downloadLogs = (): void => {
    const data = JSON.stringify(syncEvents, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dexie-cloud-debug-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Event Log</h2>
        <button
          onClick={downloadLogs}
          className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded"
        >
          <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
          Download Snapshot
        </button>
      </div>
      <div className="overflow-auto max-h-80">
        <table className="min-w-full table-auto">
          <thead>
          <tr>
            <th className="px-4 py-2 border-b">Time</th>
            <th className="px-4 py-2 border-b">Message</th>
          </tr>
          </thead>
          <tbody>
          {allEvents?.slice()?.reverse()?.map((log, index) => (
            <tr key={index} className="border-b">
              <td className="px-4 py-2 text-sm">
                {new Date(log.date).toLocaleTimeString()}
              </td>
              <td className="px-4 py-2 text-sm">{log.message}</td>
            </tr>
          ))}
          {allEvents.length === 0 && (
            <tr>
              <td className="px-4 py-2" colSpan={2}>
                No log entries.
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventLogTab;
