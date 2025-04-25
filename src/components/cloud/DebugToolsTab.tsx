import React, {useContext} from "react";
import { WifiIcon as WifiOffIcon } from "@heroicons/react/24/solid";
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";

const DebugToolsTab: React.FC<any> = () => {
  const {db} = useContext(IndexedDBDebugBarContext)!;

  const simulateNetworkCondition = (): void => {
    console.log("Simulated offline network condition (not implemented)", db.cloud.options?.disableWebSocket);
    db.cloud.options.disableWebSocket = !db.cloud.options.disableWebSocket
    db.close()
    db.open().then(() => {})
  };


  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg">Additional Debug Tools</h2>
        <div className="flex space-x-2">
          <button
            onClick={simulateNetworkCondition}
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded"
          >
            <WifiOffIcon className="h-5 w-5 inline-block mr-2" />
            {db.cloud.options.disableWebSocket ? 'Reconnect Websocket' : 'Disconnect Websocket'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugToolsTab;
