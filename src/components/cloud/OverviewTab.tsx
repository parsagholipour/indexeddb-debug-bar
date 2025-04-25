import React, {useState, useEffect, useContext} from "react";
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";


const OverviewTab: React.FC<any> = () => {
  const {db} = useContext(IndexedDBDebugBarContext)!;
  const dexieCloud = db.cloud;
  const [apiInfo] = useState({
    version: dexieCloud.version,
    options: dexieCloud.options,
    schema: dexieCloud.schema,
  });
  const [user, setUser] = useState<any>(null);
  const [wsStatus, setWsStatus] = useState<string>("not-started");
  const [syncState, setSyncState] = useState<{ status: string; phase: string }>({
    status: "not-started",
    phase: "initial",
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const subscriptions: Array<{ unsubscribe: () => void }> = [];
    if (dexieCloud.currentUser && dexieCloud.currentUser.subscribe) {
      subscriptions.push(
        dexieCloud.currentUser.subscribe((u: any) => setUser(u))
      );
    }
    if (dexieCloud.webSocketStatus && dexieCloud.webSocketStatus.subscribe) {
      subscriptions.push(
        dexieCloud.webSocketStatus.subscribe((status: string) =>
          setWsStatus(status)
        )
      );
    }
    if (dexieCloud.syncState && dexieCloud.syncState.subscribe) {
      subscriptions.push(
        dexieCloud.syncState.subscribe((state: any) => setSyncState(state))
      );
    }
    return () => {
      subscriptions.forEach((s) => s.unsubscribe && s.unsubscribe());
    };
  }, [dexieCloud]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg">API & Version Info</h2>
        <p>
          <strong>Version:</strong> {apiInfo.version}
        </p>
        <p>
          <strong>Database URL:</strong> {apiInfo.options?.databaseUrl}
        </p>
      </div>
      <div>
        <h2 className="font-bold text-lg">User Details</h2>
        {user ? (
          <>
            <p>
              <strong>User ID:</strong> {user.userId}
            </p>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>License:</strong> {user.license?.type} (
              {user.license?.status})
            </p>
            <p>
              <strong>Last Login:</strong>{" "}
              {new Date(user.lastLogin).toLocaleString()}
            </p>
          </>
        ) : (
          <p>No user logged in.</p>
        )}
      </div>
      <div>
        <h2 className="font-bold text-lg">Connection & Sync Status</h2>
        <p>
          <strong>WebSocket Status:</strong>{" "}
          <span className="font-mono">{wsStatus}</span>
        </p>
        <p>
          <strong>Sync State:</strong> {syncState.phase} (
          {syncState.status})
        </p>
        {isSyncing && (
          <p>
            <strong>Sync Progress:</strong> {syncState.progress || 0}%
          </p>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
