import React, {useState, useEffect, useContext} from "react";
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";
import clsx from "clsx";


const DiagnosticsTab: React.FC<any> = () => {
  const {db} = useContext(IndexedDBDebugBarContext)!;
  const dexieCloud = db.cloud;
  const [wsStatus, setWsStatus] = useState<string>("not-started");
  const [syncState, setSyncState] = useState<{ phase: string; status: string }>({
    phase: "initial",
    status: "not-started",
  });
  const [serviceWorkerStatus] = useState({
    usingServiceWorker: dexieCloud.usingServiceWorker,
    isServiceWorkerDB: dexieCloud.isServiceWorkerDB,
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscriptions: Array<{ unsubscribe: () => void }> = [];
    if (
      dexieCloud.webSocketStatus &&
      dexieCloud.webSocketStatus.subscribe
    ) {
      subscriptions.push(
        dexieCloud.webSocketStatus.subscribe((status: string) =>
          setWsStatus(status)
        )
      );
    }
    if (dexieCloud.syncState && dexieCloud.syncState.subscribe) {
      subscriptions.push(
        dexieCloud.syncState.subscribe((state: any) => {
          setSyncState(state);
          if (state.error) {
            setError(state.error);
          }
        })
      );
    }
    return () => {
      subscriptions.forEach((s) => s.unsubscribe && s.unsubscribe());
    };
  }, [dexieCloud]);

  return (
    <div className="space-y-4">
      <div>
        <div className={'flex space-x-5'}>
          <p>
            <strong>WebSocket:</strong>{" "}
            <span className="px-2 py-1 rounded bg-blue-500">
            {wsStatus}
          </span>
          </p>
          <p>
            <strong>Sync:</strong>{" "}
            <span className="px-2 py-1 rounded bg-green-500">
            {syncState.phase}
          </span>
          </p>
        </div>
        {error && (
          <div className="bg-red-500 p-2 rounded">
            <p>
              <strong>Error:</strong> {error.message}
            </p>
            <button
              onClick={() =>
                navigator.clipboard.writeText(error.message)
              }
              className="text-blue-600 underline"
            >
              Copy Error
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">Service Worker Diagnostics</h2>
        <div className={'flex flex-col gap-1'}>
          <p>
            <strong>Using Service Worker:</strong>{" "}
            <span className={clsx([
              'px-2 text-sm rounded',
              serviceWorkerStatus.usingServiceWorker ? 'bg-green-500' : 'bg-gray-500'
            ])}>
            {serviceWorkerStatus.usingServiceWorker ? "Yes" : "No"}
          </span>
          </p>
          <p>
            <strong>Is Service Worker DB:</strong>{" "}
            <span className={clsx([
              'px-2 text-sm rounded',
              serviceWorkerStatus.isServiceWorkerDB ? 'bg-green-500' : 'bg-gray-500'
            ])}>
            {serviceWorkerStatus.isServiceWorkerDB ? "Yes" : "No"}
          </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsTab;
