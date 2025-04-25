import React, {useState, useEffect, useContext} from "react";
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";

type StatsTabProps = object

const StatsTab: React.FC<StatsTabProps> = () => {
  const {db} = useContext(IndexedDBDebugBarContext)!;
  const dexieCloud = db.cloud;
  const [persistedSyncState, setPersistedSyncState] = useState<any>(null);
  const [roles, setRoles] = useState<any>({});
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    const subscriptions: Array<{ unsubscribe: () => void }> = [];
    if (
      dexieCloud.persistedSyncState &&
      dexieCloud.persistedSyncState.subscribe
    ) {
      subscriptions.push(
        dexieCloud.persistedSyncState.subscribe((state: any) => {
          setPersistedSyncState(state);
        })
      );
    }
    if (dexieCloud.invites && dexieCloud.invites.subscribe) {
      subscriptions.push(
        dexieCloud.invites.subscribe((inv: any[]) => {
          setInvites(inv);
        })
      );
    }
    if (dexieCloud.roles && dexieCloud.roles.subscribe) {
      subscriptions.push(
        dexieCloud.roles.subscribe((r: any) => {
          setRoles(r);
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
        <h2 className="font-bold text-lg">Persisted Sync State</h2>
        <pre className="text-xs text-green-300 whitespace-pre-wrap p-2 rounded">
          {JSON.stringify(persistedSyncState, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-lg">Roles & Invites</h2>
        <div>
          <h3 className="underline">Roles</h3>
          <pre className="text-xs text-green-300 whitespace-pre-wrap p-2 rounded">
            {JSON.stringify(roles, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="underline">Invites</h3>
          <pre className="text-xs text-green-300 whitespace-pre-wrap p-2 rounded">
            {JSON.stringify(invites, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
