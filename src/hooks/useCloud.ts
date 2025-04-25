import {useCallback, useContext} from "react";
import IndexedDBDebugBarContext from "../contexts/IndexedDBDebugBarContext.tsx";
import dexieCloudTableNames from "../const/dexieCloudTableNames.ts";
import {Table} from "dexie";

export default function useCloud() {
  const {isCloud} = useContext(IndexedDBDebugBarContext)!;

  const isTableCloud = useCallback((table: Table | string) => {
    const tableName = typeof table === 'string' ? table : table.name;
    if (!isCloud)
      return false;
    return dexieCloudTableNames.includes(tableName) || (tableName.startsWith('$') && tableName.endsWith('_mutations'))
  }, [isCloud])

  return {
    isTableCloud,
    isCloud,
  }
}
