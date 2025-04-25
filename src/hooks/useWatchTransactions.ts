import {useEffect, useRef, useState} from 'react';
import Dexie from 'dexie';
import {Operation} from "../common/Operation.ts";

const typeMap: Record<string, string> = {
  add: "create",
  delete: 'delete',
  put: 'update'
}

const useWatchTransactions = (db: Dexie): {operations: Operation[]; clearOperations: () => void} => {
  const [operations, setOperations] = useState<Operation[]>([]);
  function logOperation(op: Partial<Operation>) {
    setOperations((prev) => [
      ...prev,
      {
        table: op.table ?? '?',
        type: op.type ?? 'unknown',
        timestamp: new Date(),
        ...op,
      } as Operation,
    ]);
  }

  const mutatedTables = useRef([])

  useEffect(() => {
    if (db.use) {
      // Using DBCore approach
      db.use({
        stack: 'dbcore',
        name: 'OperationLoggingMiddleware',
        create(downlevelDatabase: any) {
          return {
            ...downlevelDatabase,
            table(tableName: string) {
              const downlevelTable = downlevelDatabase.table(tableName);

              return {
                ...downlevelTable,
                async mutate(req) {
                  const startTime = performance.now();
                  if (!mutatedTables.current.includes(tableName)) {
                    mutatedTables.current.push(tableName)
                  }
                  const result = await downlevelTable.mutate(req);
                  const endTime = performance.now();
                  console.log('mutatedTables.current actual mutation', req, result, mutatedTables.current, tableName)

                  logOperation({
                    type: typeMap[req.type] || req.type,
                    table: tableName,
                    duration: endTime - startTime,
                    timestamp: new Date(),
                    keys: req.key ? [req.key] : req?.keys,
                    results: req.type === 'delete' ? result : {
                      changeSpec: req.changeSpec,
                      results: req.values,
                    },
                  });

                  return result;
                },
                async get(req) {
                  const startTime = performance.now();
                  const result = await downlevelTable.get(req);
                  const endTime = performance.now();

                  logOperation({
                    type: 'read',
                    table: tableName,
                    duration: endTime - startTime,
                    timestamp: new Date(),
                    keys: req.key ? [req.key] : undefined,
                    results: result,
                  });

                  return result;
                },

                async getMany(req) {
                  const startTime = performance.now();
                  const result = await downlevelTable.getMany(req);
                  const endTime = performance.now();
                  if (req.trans.mode === 'readwrite' && req.cache === 'immutable' && req.keys?.length) {
                    return result;
                  }

                  logOperation({
                    type: 'read',
                    table: tableName,
                    duration: endTime - startTime,
                    timestamp: new Date(),
                    keys: req.keys,
                    results: result,
                  });

                  return result;
                },
                async query(req) {
                  const startTime = performance.now();
                  const result = await downlevelTable.query(req);
                  const endTime = performance.now();


                  // this prevents logging a 'reading' event for mutations
                  // TODO find a better solution
                  if (mutatedTables.current.includes(tableName)) {
                    mutatedTables.current = mutatedTables.current.filter(i => i !== tableName)
                    return result
                  }

                  // if it is not a read operation skip (prevent redundant logs)
                  if (req.trans.mode === 'readwrite') {
                    return result
                  }

                  console.log('mutatedTables.current', req, result, mutatedTables.current, tableName)

                  logOperation({
                    type: 'read',
                    table: tableName,
                    duration: endTime - startTime,
                    timestamp: new Date(),
                    queryDetails: {
                      index: req.query.index,
                      range: req.query.range,
                      limit: req.query.limit,
                      offset: req.query.offset,
                    },
                    results: result,
                  });

                  return result;
                },
                //
                // async openCursor(req) {
                //   if (!(dexieCloudTableNames.includes(tableName) || (tableName.startsWith('$') && tableName.endsWith('_mutations')))) {
                //     console.log('qqqqqqqqq4', req, req.trans?.mutatedParts)
                //   }
                //   const startTime = performance.now();
                //   const cursor = await downlevelTable.openCursor(req);
                //   const endTime = performance.now();
                //
                //   logOperation({
                //     type: 'reading',
                //     table: tableName,
                //     duration: endTime - startTime,
                //     timestamp: new Date(),
                //     queryDetails: {
                //       index: req.query?.index,
                //       range: req.query?.range,
                //     },
                //     results: null,
                //   });
                //
                //   return cursor;
                // },

              };
            },
          };
        },
      });
    } else {
      // Support for older Dexie versions using hooks:
      const ops: Operation[] = [];
      const unsubscribes: (() => void)[] = [];

      db.tables.forEach((table) => {
        // ---- CREATING ----
        function creatingListener(primKey: any, obj: any, transaction: any) {
          const startTime = performance.now();
          transaction.on('complete', () => {
            const endTime = performance.now();
            ops.push({
              type: 'create',
              table: table.name,
              key: primKey,
              obj,
              timestamp: new Date(),
              duration: endTime - startTime,
            });
            setOperations([...ops]);
          });
        }
        table.hook('creating', creatingListener);

        // ---- READING ----
        function readingListener(obj: any, transaction: any) {
          const startTime = performance.now();
          transaction.on('complete', () => {
            const endTime = performance.now();
            ops.push({
              type: 'reading',
              table: table.name,
              obj,
              timestamp: new Date(),
              duration: endTime - startTime,
              results: obj,
            });
            setOperations([...ops]);
          });
          return obj;
        }
        table.hook('reading', readingListener);

        // ---- UPDATING ----
        function updatingListener(modifications: any, primKey: any, obj: any, transaction: any) {
          const startTime = performance.now();
          transaction.on('complete', () => {
            const endTime = performance.now();
            ops.push({
              type: 'update',
              table: table.name,
              key: primKey,
              modifications,
              timestamp: new Date(),
              duration: endTime - startTime,
            });
            setOperations([...ops]);
          });
        }
        table.hook('updating', updatingListener);

        // ---- DELETING ----
        function deletingListener(primKey: any, obj: any, transaction: any) {
          const startTime = performance.now();
          transaction.on('complete', () => {
            const endTime = performance.now();
            ops.push({
              type: 'delete',
              table: table.name,
              key: primKey,
              timestamp: new Date(),
              duration: endTime - startTime,
            });
            setOperations([...ops]);
          });
        }
        table.hook('deleting', deletingListener);

        // Push cleanup function for this table into the unsubscribes array
        unsubscribes.push(() => {
          table.hook('creating').unsubscribe(creatingListener);
          table.hook('reading').unsubscribe(readingListener);
          table.hook('updating').unsubscribe(updatingListener);
          table.hook('deleting').unsubscribe(deletingListener);
        });
      });

      return () => {
        unsubscribes.forEach((unsubscribeFn) => unsubscribeFn());
      };
    }
  }, [db]);

  const clearOperations = () => setOperations([])

  return {operations, clearOperations};
};

export default useWatchTransactions;
