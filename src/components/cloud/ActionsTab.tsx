import React, {useContext, useState} from "react";
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";

interface ActionsTabProps {
  addLog: (msg: string) => void;
}

const ActionsTab: React.FC<ActionsTabProps> = ({ addLog }) => {
  const {db} = useContext(IndexedDBDebugBarContext)!;
  const dexieCloud = db.cloud;
  const [permissions, setPermissions] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [apiInfo, setApiInfo] = useState({ options: dexieCloud.options });
  const [user, setUser] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const email = window.prompt('Enter your email')
      if (!email)
        return; // cancel
      await dexieCloud.login({ email, grant_type: "otp" });
      addLog("Login triggered");
    } catch (err: any) {
      setError(err);
      addLog("Login error: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dexieCloud.logout();
      addLog("Logout triggered");
    } catch (err: any) {
      setError(err);
      addLog("Logout error: " + err.message);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    addLog("Sync triggered");
    try {
      await dexieCloud.sync();
      addLog("Sync successful");
    } catch (err: any) {
      setError(err);
      addLog("Sync error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfigChange = () => {
    const newOptions = {
      ...apiInfo.options,
      disableWebSocket: !apiInfo.options.disableWebSocket,
    };
    dexieCloud.configure(newOptions);
    setApiInfo({ ...apiInfo, options: newOptions });
    addLog("Configuration updated (WebSocket toggled)");
  };

  const checkPermissions = async () => {
    try {
      const realmId = window.prompt('Enter realmId')
      if (!realmId)
        return;
      const tableName = window.prompt('Enter table name')
      if (!tableName)
        return;
      const entity = {
        owner: user ? user.userId : "unknown",
        realmId: realmId,
        table: () => tableName,
      };
      const permObs = dexieCloud.permissions(entity);
      const sub = permObs.subscribe((perm: any) => {
        setPermissions(perm);
        addLog("Permissions checked");
        sub.unsubscribe();
      });
    } catch (err: any) {
      setError(err);
      addLog("Permissions error: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        {dexieCloud.currentUser.getValue().userId === 'unauthorized' ? <button
            disabled={loginLoading}
            onClick={handleLogin}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded"
          >
            <UserIcon className="h-5 w-5 inline-block mr-2"/>
            {loginLoading ? 'Logging In' : 'Login'}
          </button> :
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 inline-block mr-2"/>
            Logout
          </button>
        }
      </div>
      <div>
        <button
          onClick={handleSync}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded"
        >
          <ArrowPathIcon className="h-5 w-5 inline-block mr-2"/>
          {isSyncing ? "Syncing..." : "Trigger Sync"}
        </button>
      </div>
      <div>
        <h2 className="font-bold text-lg mb-1">Permissions</h2>
        <button
          onClick={checkPermissions}
          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded"
        >
          <ShieldCheckIcon className="h-5 w-5 inline-block mr-2" />
          Check Permissions
        </button>
        {permissions && (
          <pre className="bg-gray-700 text-green-300 p-2 rounded mt-2">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        )}
      </div>
      {error && (
        <div className="bg-red-500 p-2 rounded">
          <p>
            <strong>Error:</strong> {error.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActionsTab;
