import React, { useState, useRef, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TableList from "../TableList.tsx";
import TableDetails from "../TableDetails.tsx";
import { liveQuery, Table } from "dexie";
import { exportDB } from 'dexie-export-import';
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";
import Loading from "../shared/Loading.tsx";

function Tables() {
  const {db, isCloud} = useContext(IndexedDBDebugBarContext)!;
  const tables = db.tables;
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableMode, setTableMode] = useState<'browse' | 'structure' | null>('browse');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tablePrimaryKeys, setTablePrimaryKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tableDetailsRef = useRef<HTMLElement | null>(null);
  const isScrolledToTableDetailsRef = useRef(false);

  // A ref to store the table selected for import:
  const tableImportRef = useRef<Table | null>(null);

  const liveQuerySubscriptionRef = useRef<any>(null);

  // Cleanup subscription on unmount:
  useEffect(() => {
    return () => {
      if (liveQuerySubscriptionRef.current) {
        liveQuerySubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const handleExportTableAsCsv = async (table: Table) => {
    try {
      const tableName = table.name;
      const rows = await db.table(tableName).toArray();

      if (rows.length === 0) {
        alert(`No data available in table "${tableName}" to export.`);
        return;
      }

      // Use the keys from the first row as headers.
      const headers = Object.keys(rows[0]);
      const csvData = [];

      // Add CSV header row.
      csvData.push(headers.join(','));

      // Process each row.
      rows.forEach(row => {
        const values = headers.map(header => {
          let cell = row[header];
          if (cell === null || cell === undefined) {
            cell = "";
          } else if (typeof cell === 'object') {
            cell = JSON.stringify(cell);
          }
          const cellStr = String(cell);
          // Escape double quotes and wrap in quotes if needed.
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        });
        csvData.push(values.join(','));
      });

      const csvString = csvData.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${db.name}_${tableName}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`CSV export of table ${table.name} failed:`, error);
    }
  };

  // ========== PER-TABLE Export/Import ==========
  const handleExportTable = async (table: Table) => {
    try {
      const { name: tableName } = table;
      const blob = await exportDB(db, {
        filter: (t) => t === tableName,
        prettyJson: true,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${db.name}_${tableName}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Export of table ${table.name} failed:`, error);
    }
  };

  const handleImportTableFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tableImportRef.current) return;

    try {
      const ab = await file.arrayBuffer();
      const jsonStr = new TextDecoder().decode(ab);
      const parsed = JSON.parse(jsonStr);

      const tableData = parsed?.data?.data?.find(
        (d: any) => d.tableName === tableImportRef.current?.name
      );

      if (!tableData?.rows) {
        alert(`No rows found for table "${tableImportRef.current.name}" in the file.`);
        return;
      }

      await db.table(tableImportRef.current.name).clear();
      await db.table(tableImportRef.current.name).bulkAdd(tableData.rows);

      alert(`Table "${tableImportRef.current.name}" imported successfully with ${tableData.rows.length} records.`);
      if (selectedTable?.name === tableImportRef.current.name && tableMode === 'browse') {
        refreshTableData();
      }
    } catch (error) {
      console.error(`Import of table ${tableImportRef.current.name} failed:`, error);
    } finally {
      event.target.value = '';
      tableImportRef.current = null;
    }
  };

  const handleImportTable = (table: Table) => {
    tableImportRef.current = table;
    const input = document.getElementById('importTableInput') as HTMLInputElement | null;
    input?.click();
  };

  // ========== Table browsing & structure ==========
  const refreshTableData = async () => {
    if (selectedTable && tableMode === 'browse') {
      const data = await db.table(selectedTable.name).toArray();
      setTableData(data);
    }
  };

  const handleBrowse = async (table: Table, {dontScroll = false} = {}) => {
    if (table === selectedTable && tableMode === 'browse' && !dontScroll) {
      return tableDetailsRef.current?.scrollIntoView({ behavior: 'instant' });
    }
    setSelectedTable(table);
    setTableMode('browse');
    if (!dontScroll) {
      isScrolledToTableDetailsRef.current = false;
    } else {
      isScrolledToTableDetailsRef.current = true;
    }
    if (liveQuerySubscriptionRef.current) {
      liveQuerySubscriptionRef.current.unsubscribe();
    }
    setLoading(true);
    const liveQueryObservable = liveQuery(() => db.transaction('r', db.table(table.name), () => Promise.all([
      db[table.name].toCollection().primaryKeys(),
      db.table(table.name).toArray()
    ])));
    liveQuerySubscriptionRef.current = liveQueryObservable.subscribe({
      next: (result) => {
        setLoading(false);
        setTablePrimaryKeys(result[0]);
        if (!table.schema?.primKey?.keyPath) {
          const data = result[1];
          result[0].forEach((key, index) => {
            data[index] = {
              __outbound_key: key,
              ...data[index],
            }
          })
          setTableData(data);
        } else {
          setTableData(result[1]);
        }
      },
      error: error => console.error("Live query error:", error)
    });
  };

  useEffect(() => {
    if (!isScrolledToTableDetailsRef.current && tableData && selectedTable) {
      tableDetailsRef.current?.scrollIntoView({
        behavior: 'instant'
      });
    }
  }, [tableData]);

  useEffect(() => {
    if (db && !selectedTable && !isCloud) {
      handleBrowse(db.tables[0], {
        dontScroll: true,
      });
    }
  }, [db]);

  const handleStructure = (table: Table) => {
    setSelectedTable(table);
    setTableMode('structure');
    setTableData([]);
  };

  const handleTruncateTable = async (table: Table) => {
    if (window.confirm(`This will delete all rows from "${table.name}". Do you want to continue?`)) {
      await db.table(table.name).clear();
      await refreshTableData();
    }
  };

  return (
    <>
      {/* Hidden input for per-table import */}
      <input
        type="file"
        accept="application/json"
        onChange={handleImportTableFile}
        className="hidden"
        id="importTableInput"
      />

      <TableList
        tables={tables}
        selectedTable={selectedTable}
        tableMode={tableMode}
        handleBrowse={handleBrowse}
        handleStructure={handleStructure}
        handleTruncateTable={handleTruncateTable}
        handleExportTable={handleExportTable}
        handleImportTable={handleImportTable}
        handleExportTableAsCsv={handleExportTableAsCsv}
      />

      {!loading ? (
        <>
          <AnimatePresence>
            {selectedTable && (
              <motion.div
                ref={tableDetailsRef}
                key="table-details"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.1 }}
              >
                <TableDetails
                  table={selectedTable}
                  tableMode={tableMode}
                  tablePrimaryKeys={tablePrimaryKeys}
                  tableData={tableData}
                  refreshTableData={refreshTableData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <Loading className={'mt-2'} />
      )}
    </>
  );
}

export default Tables;
