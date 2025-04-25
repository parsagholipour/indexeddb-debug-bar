import React, {forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ClockIcon, MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/outline';
import {motion} from 'framer-motion';

import ItemModal from './ItemModal';
import TableSchema from "./TableSchema.tsx";
import IndexedDBDebugBarContext from "../contexts/IndexedDBDebugBarContext.tsx";
import {Table} from "dexie";
import RowChangeHistoryModal from "./RowChangeHistoryModal.tsx";
import {KeyIcon} from "@heroicons/react/24/solid";
import {getRowKey, getRowKeyQueriable, getRowKeyQueriableForDelete} from "../utils/helpers.ts";
import omit from "lodash.omit";

interface TableDetailsProps {
  table: Table;
  tableMode: 'browse' | 'structure' | null;
  tablePrimaryKeys?: (string | string[])[];
  tableData: any[];
  refreshTableData: () => void;
}

const BLINK_DURATION = 300

const TableDetails = forwardRef(({
                                   table,
                                   tableMode,
                                   tableData,
                                   tablePrimaryKeys,
                                   refreshTableData
                                 }: TableDetailsProps, ref) => {

  const { db, isCloud } = useContext(IndexedDBDebugBarContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRowData, setEditingRowData] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'update' | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc'; }>({
    key: null,
    direction: 'asc'
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<any>>(new Set());
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{ rowKey: any, columnKey: string } | null>(null);
  const [inlineEditingValue, setInlineEditingValue] = useState("");
  const [changeHistory, setChangeHistory] = useState<Map<any, { data: any; changedAt: Date | null }[]>>(() => new Map())
  const [selectedChangeHistory, setSelectedChangeHistory] = useState<any>(null)
  const [isChangeHistoryModalOpen, setIsChangeHistoryModalOpen] = useState(false);
  const searchElRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchActive) {
      searchElRef.current?.focus();
    }
  }, [searchActive]);

  useEffect(() => {
    if (selectedChangeHistory) {
      if (changeHistory.get(selectedChangeHistory[0])) {
        setSelectedChangeHistory([selectedChangeHistory[0], changeHistory.get(selectedChangeHistory[0])])
      }
    }
  }, [changeHistory]);

  // New state to track changed row keys based on prop updates.
  const [changedRows, setChangedRows] = useState<Set<any>>(new Set());

  // Determine the primary key field from the table schema.
  const primaryKeyField = table.schema?.primKey?.keyPath;
  const isOutboundKeyTable = primaryKeyField === null;

  // Keep track of previous tableData to detect changes.
  const prevTableDataRef = useRef<any[]>(tableData);

  const getPrimaryKeys = useCallback((table: Table) => {
    return Array.isArray(table.schema.primKey.keyPath) ? table.schema.primKey.keyPath : [table.schema.primKey.keyPath]
  }, []);

  const primaryKeys = useMemo(() => getPrimaryKeys(table), [table]);

  useEffect(() => {
    setChangeHistory(new Map())
    setChangedRows(new Set())
  }, [table]);

  // Compare new tableData with previous tableData and mark changed rows.
  useEffect(() => {
    if (!prevTableDataRef.current) {
      prevTableDataRef.current = tableData;
      return;
    }
    const newChangeHistory = new Map<string | number, { data: any; changedAt: Date | null }[]>(changeHistory);
    const newChangedRows = new Set<any>();
    tableData.forEach(row => {
      if (!primaryKeyField) return;
      const key = getRowKey(row, primaryKeyField);
      if (key === undefined) return;
      const prevRow = prevTableDataRef.current.find(r => {
        const prevKey = getRowKey(r, primaryKeyField);
        return prevKey === key;
      });
      // If the row is new or changed (using a simple JSON comparison), mark it.
      if (prevRow && JSON.stringify(row) !== JSON.stringify(prevRow)) {
        const prevData = newChangeHistory.get(key) || []
        newChangeHistory.set(key, [
          ...(prevData?.length ? prevData : [{data: prevRow, changedAt: null}]),
          {data: row, changedAt: new Date()}
        ])
        newChangedRows.add(key);
      }
    });
    if (newChangedRows.size > 0) {
      setChangedRows(newChangedRows);
      // Remove the highlight after 2 seconds.
      setTimeout(() => {
        setChangedRows(new Set());
      }, BLINK_DURATION);
    }
    if (newChangeHistory.size > 0) {
      setChangeHistory(newChangeHistory);
    }
    // Update previous tableData reference.
    prevTableDataRef.current = tableData;
  }, [tableData, primaryKeyField]);

  const handleAddItem = () => {
    setEditingRowData(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditItem = (row: any) => {
    setEditingRowData(row);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleRollback = async (row: any) => {
    const keyValue = getRowKey(row, primaryKeyField)
    await table.put(row, getRowKeyQueriable(keyValue));
  };

  const handleDeleteItem = async (row: any, rowIdx: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const key = getRowKey(row, primaryKeyField);
    try {
      const queriableKey = getRowKeyQueriableForDelete(key)
      await table.delete(queriableKey);
      setSelectedRowKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      await refreshTableData();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert(`Error deleting record: ${error}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.size === 0) return;
    if (!window.confirm("Are you sure you want to delete the selected records?")) return;
    try {
      await Promise.all(
        Array.from(selectedRowKeys).map(async (key) => {
          const queriableKey = getRowKeyQueriableForDelete(key)

          return table.delete(queriableKey)
        })
      );
      setSelectedRowKeys(new Set());
      await refreshTableData();
    } catch (error) {
      console.error("Error bulk deleting records:", error);
      alert(`Error bulk deleting records: ${error}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalMode(null);
  };

  const handleItemSubmit = async (data: any, key?: string) => {
    try {
      // if synced table, primary keys should be string
      if (isCloud && db.cloud.persistedSyncState.getValue()?.syncedTables.find(syncedTable => syncedTable === table.name)) {
        const keyPath = getPrimaryKeys(table);
        keyPath?.forEach(key => {
          if (!key) return;
          if (typeof data[key] === 'number') {
            data[key] = String(data[key]);
          }
        })
      }
      if (modalMode === 'edit' && editingRowData) {
        await table.put(data, key);
      } else if (modalMode === 'add') {
        await table.add(data, key);
      }
      setIsModalOpen(false);
      await refreshTableData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert(`Error: ${error}`);
    }
  };

  // Collect all keys across all rows.
  const allKeys = Array.from(new Set(tableData.flatMap((row) => Object.keys(row))));

  // ---- Filtering based on search query ----
  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return JSON.stringify(val).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [tableData, searchQuery]);

  // Sorting handler.
  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'desc') {
        setSortConfig({
          key: null,
          direction: 'asc',
        });
      } else {
        setSortConfig({ key, direction: 'desc'});
      }
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const toggleRowSelection = (row: any) => {
    const key = getRowKey(row, primaryKeyField);
    if (key === undefined) return;
    setSelectedRowKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key))
        newSet.delete(key);
      else
        newSet.add(key);
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!primaryKeyField) return;
    if (e.target.checked) {
      const allKeysSet = new Set(
        sortedData
          .map(row => getRowKey(row, primaryKeyField))
          .filter(key => key !== undefined)
      );
      setSelectedRowKeys(allKeysSet);
    } else {
      setSelectedRowKeys(new Set());
    }
  };

  const allSelected =
    primaryKeyField &&
    sortedData.length > 0 &&
    sortedData.every(row =>
      selectedRowKeys.has(getRowKey(row, primaryKeyField))
    );

  const heading = tableMode === 'browse'
    ? `Browsing ${table.name}`
    : `Structure of ${table.name}`;

  return (
    <div ref={ref} className="mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{heading}</h3>
        {tableMode === 'browse' && (
          <div className="flex gap-2 items-center">
            {selectedRowKeys.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              >
                Bulk Delete
              </button>
            )}
            {searchActive && (
              <input
                ref={searchElRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2 py-1 rounded outline-[1px] outline-gray-300 text-black max-h-full"
              />
            )}
            <button
              onClick={() => setSearchActive(prev => !prev)}
              className="inline-flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
              title="Toggle Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <button
              className="inline-flex items-center bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
              onClick={handleAddItem}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add
            </button>
          </div>
        )}
      </div>

      {tableMode === 'browse' ? (
        sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 mt-2">
              <thead>
              <tr>
                {allKeys.map((key, index) => (
                  <th
                    key={key}
                    className="px-4 py-2 cursor-pointer select-none"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex gap-1">
                      {index === 0 && (
                        <input
                          onClick={e => e.stopPropagation()}
                          type="checkbox"
                          checked={!!allSelected}
                          onChange={handleSelectAll}
                          className="mr-2"
                        />
                      )}
                      <div className={'flex'}>
                        {(primaryKeys.includes(key) || key === '__outbound_key') && <KeyIcon className={'me-2 text-yellow-300'} width={15} />}
                        {key === '__outbound_key' ? 'key' : key}
                        {sortConfig.key === key && (
                          <span className="ml-2">
                              {sortConfig.direction === 'asc' ? '▲' : '▼'}
                            </span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2">Actions</th>
              </tr>
              </thead>
              <tbody>
              {sortedData.map((row, idx) => {
                const rowKey = getRowKey(row, primaryKeyField);
                const isChanged = changedRows.has(rowKey);
                return (
                  <motion.tr
                    key={rowKey}
                    className="border-t border-gray-600"
                    initial={{ backgroundColor: "rgba(255,76,88,0)" }}
                    animate={{ backgroundColor: isChanged ? "rgba(255,76,88,0.37)" : "rgba(255,76,88, 0)" }}
                    transition={{ duration: BLINK_DURATION / 1000 }}
                  >
                    {allKeys.map((key, index) => {
                      const cellValue = row[key];
                      return (
                        <td
                          key={key + cellValue}
                          className="px-4 py-2 hover:bg-gray-600 cursor-text"
                          onClick={() => {
                            // if (primaryKeys?.includes(key)) return;
                            setEditingCell({ rowKey, columnKey: key });
                            setInlineEditingValue(
                              cellValue !== undefined
                                ? typeof cellValue === 'object'
                                  ? JSON.stringify(cellValue)
                                  : cellValue
                                : ''
                            );
                          }}
                        >
                          {index === 0 && (
                            <input
                              onClick={e => e.stopPropagation()}
                              type="checkbox"
                              checked={selectedRowKeys.has(rowKey)}
                              onChange={() => toggleRowSelection(row)}
                              className="mr-2"
                            />
                          )}
                          {editingCell &&
                          editingCell.rowKey === rowKey &&
                          editingCell.columnKey === key ? (
                            <input
                              type="text"
                              value={inlineEditingValue}
                              onChange={e => setInlineEditingValue(e.target.value)}
                              onBlur={async () => {
                                let newValue: string | number | boolean = inlineEditingValue;
                                if (typeof cellValue === "number") {
                                  newValue = Number(inlineEditingValue);
                                } else if (typeof cellValue === "boolean") {
                                  newValue = inlineEditingValue.toLowerCase() === "true";
                                } else if (typeof cellValue === "object" && cellValue !== null) {
                                  try {
                                    newValue = JSON.parse(inlineEditingValue);
                                  } catch {
                                    newValue = inlineEditingValue;
                                  }
                                }
                                try {
                                  if (newValue !== row[key]) {
                                    if (!isOutboundKeyTable) {
                                      await table.update(getRowKeyQueriable(rowKey), { [key]: newValue });
                                    } else {
                                      await table.put({ ...omit(row, '__outbound_key'), [key]: newValue }, row.__outbound_key);
                                    }
                                    await refreshTableData();
                                  }
                                } catch (e) {
                                  console.error(e)
                                  if (e.message) {
                                    alert(e.message)
                                  }
                                }
                                setEditingCell(null);
                                setInlineEditingValue("");
                              }}
                              onKeyDown={async (e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                  setEditingCell(null);
                                  setInlineEditingValue("");
                                }
                              }}
                              autoFocus
                              className="w-[100px] bg-gray-700 p-1"
                            />
                          ) : (
                            cellValue !== undefined ? JSON.stringify(cellValue) : ''
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 space-x-2">
                      <button
                        title={'Edit'}
                        onClick={() => handleEditItem(row)}
                        className="inline-flex items-center bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        title={'Delete'}
                        onClick={() => handleDeleteItem(row, idx)}
                        className="inline-flex items-center bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      {changeHistory.has(rowKey) && <button
                        title={'History'}
                        onClick={() => {
                          setSelectedChangeHistory([rowKey, changeHistory.get(rowKey)]);
                          setIsChangeHistoryModalOpen(true);
                        }}
                        className="inline-flex items-center bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded"
                      >
                        <ClockIcon className="h-5 w-5"/>
                      </button>}
                    </td>
                  </motion.tr>
                );
              })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No data available in this table.</p>
        )
      ) : (
        <TableSchema db={db} table={table}/>
      )}

      <RowChangeHistoryModal isOpen={isChangeHistoryModalOpen}
                             onRollback={handleRollback}
                             onClose={() => {
                               setIsChangeHistoryModalOpen(false);
                             }} changeHistory={selectedChangeHistory} />
      <ItemModal
        isOutboundKeyTable={isOutboundKeyTable}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        table={table}
        onSubmit={handleItemSubmit}
        initialData={editingRowData}
      />
    </div>
  );
});

export default TableDetails;
