export function getRowKey(row: any, keyPath: string | string[] | undefined) {
  if (!keyPath)
    return row?.__outbound_key || JSON.stringify(row);
  return Array.isArray(keyPath)
    ? JSON.stringify(keyPath.reduce((previousValue: any, currentValue) => {
      previousValue[currentValue] = row[currentValue];

      return previousValue;
    }, {}))
    : row[keyPath];
}

export function getRowKeyQueriable(rowKey: string) {
  try {
    if (typeof rowKey === 'string' && !isNaN(rowKey))
      return rowKey;
    return JSON.parse(rowKey);
  } catch {
    return rowKey;
  }
}

export function getRowKeyQueriableForDelete(rowKey: string) {
  const queriableKey = getRowKeyQueriable(rowKey)
  if (isObject(queriableKey)) {
    return Object.entries(queriableKey).map(i => i[1]);
  }
  return queriableKey;
}

function isObject(variable: any) {
  return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}


/**
 * Generates a Dexie.js schema from an existing IndexedDB database.
 * @param {string} dbName - The name of the IndexedDB database.
 * @returns {Promise<Object>} - A promise that resolves to an object mapping store names to Dexie schema strings.
 */
export async function generateDexieSchemaFromIDB(dbName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = function (event) {
      if (!event.target) {
        console.error(event);
        alert('Invalid Database Name')
        return;
      }
      const idb = event.target?.result;
      const schema: Record<string, any> = {};
      // Convert the DOMStringList to an array
      const storeNames = Array.from(idb.objectStoreNames);

      // Open a transaction covering all stores (readonly)
      const transaction = idb.transaction(storeNames, 'readonly');

      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const parts = [];

        // --- Primary Key ---
        const keyPath = store.keyPath;
        if (keyPath !== null) {
          if (Array.isArray(keyPath)) {
            // Compound primary key e.g. [a+b]
            parts.push("[" + keyPath.join("+") + "]");
          } else {
            // Simple key; use auto-increment prefix if needed
            parts.push(store.autoIncrement ? "++" + keyPath : keyPath);
          }
        }
        // --- Indexes ---
        // Iterate over all indexes in the store.
        const indexNames = Array.from(store.indexNames);
        indexNames.forEach(indexName => {
          const index = store.index(indexName);
          let indexSpec = "";
          // Unique indexes are prefixed with "&"
          if (index.unique) indexSpec += "&";
          // Multi-entry indexes get a "*" prefix.
          if (index.multiEntry) indexSpec += "*";
          const idxKeyPath = index.keyPath;
          if (Array.isArray(idxKeyPath)) {
            // Compound index: e.g. [&*[a+b]]
            indexSpec += "[" + idxKeyPath.join("+") + "]";
          } else {
            indexSpec += idxKeyPath;
          }
          parts.push(indexSpec);
        });

        // If there is no primary key (and no indexes), this will be an empty string.
        schema[storeName] = parts.join(", ");
      });

      idb.close();
      resolve(schema);
    };

    request.onerror = function (event) {
      reject("Error opening database: " + event.target.errorCode);
    };
  });
}

export default function generateGuid() {
  try {
    return self.crypto.randomUUID();
  } catch {}
  let result, i, j;
  result = '';
  for(j=0; j<32; j++) {
    if( j == 8 || j == 12 || j == 16 || j == 20)
      result = result + '-';
    i = Math.floor(Math.random()*16).toString(16).toUpperCase();
    result = result + i;
  }
  return result;
}
