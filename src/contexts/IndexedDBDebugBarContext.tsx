import {createContext} from 'react';
import Dexie from "dexie";
import {SyncEvent} from "../common/SyncEvent.ts";

const IndexedDBDebugBarContext = createContext<{db: Dexie; isCloud: boolean; syncEvents?: SyncEvent[]} | null>(null);

export default IndexedDBDebugBarContext
