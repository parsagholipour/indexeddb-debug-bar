import React, {useContext, useState, useEffect, useMemo} from 'react';
import {
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import {
  TrashIcon as TrashOutlineIcon,
} from '@heroicons/react/24/outline';
import useCloud from "../../hooks/useCloud.ts";
import JsonView from "../shared/JsonView.tsx";
import { Operation } from "../../common/Operation.ts";
import IndexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";

interface OperationsListProps {
  operations: Operation[];
  clearOperations?: () => void;
}

const typeIcon = (type: Operation['type']) => {
  switch (type) {
    case 'create':
      return <PlusIcon className="h-5 w-5 text-green-500" />;
    case 'read':
      return <EyeIcon className="h-5 w-5 text-blue-500" />;
    case 'update':
      return <PencilSquareIcon className="h-5 w-5 text-yellow-500" />;
    case 'delete':
      return <TrashIcon className="h-5 w-5 text-red-500" />;
    default:
      return <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />;
  }
};

const typeBadgeClasses = (type: Operation['type']) => {
  switch (type) {
    case 'create':
      return 'bg-green-600';
    case 'read':
      return 'bg-blue-600';
    case 'update':
      return 'bg-yellow-600';
    case 'delete':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
};

const OperationsList = ({ operations, clearOperations }: OperationsListProps) => {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const { isTableCloud, isCloud } = useCloud();
  const { db } = useContext(IndexedDBDebugBarContext)!;
  const [showUser, setShowUser] = useState(true);
  const [showCloud, setShowCloud] = useState(false);

  // Define the available operation types and initialize with all selected.
  const availableTypes = ["read", "create", "update", "delete"];
  const [selectedTypes, setSelectedTypes] = useState<string[]>([...availableTypes]);

  // Get table names from Dexie and use them for filtering.
  const tableNames = useMemo(() => db.tables.map(table => table.name), [db]);

  // New state for table filter visibility and the selected table names.
  const [showTableFilter, setShowTableFilter] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>(tableNames);

  // Update selectedTables if tableNames change.
  useEffect(() => {
    setSelectedTables(tableNames);
  }, [tableNames]);

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const copy = new Set(prev);
      if (copy.has(index)) {
        copy.delete(index);
      } else {
        copy.add(index);
      }
      return copy;
    });
  };

  // Filter by user/cloud tables first.
  const filteredOperations = !isCloud
    ? operations
    : operations.filter((operation) =>
      isTableCloud(operation.table) ? showCloud : showUser
    );

  // Further filter based on selected operation types.
  const typeFilteredOperations = filteredOperations.filter(op =>
    selectedTypes.includes(op.type)
  );

  // Further filter based on selected table names.
  const tableFilteredOperations = typeFilteredOperations.filter(op =>
    selectedTables.includes(op.table)
  );

  // Toggle individual type filter.
  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Toggle individual table filter.
  const toggleTable = (table: string) => {
    setSelectedTables(prev => {
      if (prev.includes(table)) {
        return prev.filter(t => t !== table);
      } else {
        return [...prev, table];
      }
    });
  };

  // Determine if "All" should be considered active for types.
  const isAllSelected = selectedTypes.length === availableTypes.length;
  // Determine if "All" should be active for table filters.
  const isAllTablesSelected = selectedTables.length === tableNames.length;

  return (
    <div className="pr-2 min-h-[200px] rounded-md overflow-y-auto">
      {isCloud && (
        <div className="mb-4 flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showUser}
              onChange={(e) => setShowUser(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span className="ml-2">User Tables</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showCloud}
              onChange={(e) => setShowCloud(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span className="ml-2">Cloud System Tables</span>
          </label>
        </div>
      )}

      <div className="flex justify-between">
        {/* Operation Type Filters */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTypes([...availableTypes])}
            className={`px-3 py-1 rounded border ${
              isAllSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1 rounded border ${
                selectedTypes.includes(type)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Table Filter Button (toggles the table filter panel) */}
          <button
            onClick={() => setShowTableFilter(!showTableFilter)}
            className="mb-4 px-2 py-1 bg-gray-600 flex gap-1 text-white rounded-md hover:bg-gray-500"
          >
            <FunnelIcon width={18} />
            Filter Tables
          </button>
          {/* Clear Operations Button */}
          {clearOperations && (
            <button
              onClick={clearOperations}
              className="mb-4 px-2 py-1 bg-red-600 flex gap-1 text-white rounded-md hover:bg-red-500"
            >
              <TrashOutlineIcon width={20} />
              Clear Operations
            </button>
          )}
        </div>
      </div>

      {/* Table Filters Panel */}
      {showTableFilter && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTables([...tableNames])}
            className={`px-3 py-1 rounded border ${
              isAllTablesSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {tableNames.map((table) => (
            <button
              key={table}
              onClick={() => toggleTable(table)}
              className={`px-3 py-1 rounded border ${
                selectedTables.includes(table)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {table}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-4">
        {tableFilteredOperations?.length === 0 && (
          <div className="mt-2 bg-gray-700 border border-gray-600 rounded min-h-20 p-5 flex items-center justify-center">
            No operations yet
          </div>
        )}
        {tableFilteredOperations
          .slice()
          .reverse()
          .map((op, index) => {
            const isExpanded = expandedIndices.has(index);
            return (
              <li
                key={index}
                className="border bg-gray-700 border-gray-700 rounded-md p-4 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {typeIcon(op.type)}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold text-white px-2 py-0.5 rounded-md ${typeBadgeClasses(
                          op.type
                        )}`}
                      >
                        {op.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-200">
                        on table <strong>{op.table}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 ml-4">
                    {op.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-1 my-2">
                  <ClockIcon className="h-4 w-4 text-gray-300" />
                  <span className="text-xs">Duration</span>
                  <span className="text-xs font-semibold text-white px-2 py-0.5 bg-gray-600 rounded">
                    {!isNaN(op.duration) ? `${op.duration.toFixed(2)} ms` : 'N/A'}
                  </span>
                </div>

                {op.keys && op.keys.length > 0 && (
                  <div className="text-sm text-gray-400 mt-1">
                    <strong>Keys:</strong> {JSON.stringify(op.keys)}
                  </div>
                )}
                {op.values && op.values.length > 0 && (
                  <div className="text-sm text-gray-400 mt-1">
                    <strong>Values:</strong> {JSON.stringify(op.values)}
                  </div>
                )}
                {op.results !== undefined && (
                  <div className="text-sm text-gray-400 mt-1">
                    <strong>Results:</strong>{' '}
                    <JsonView json={JSON.stringify(op.results?.result || op.results)} />
                  </div>
                )}

                {op.queryDetails && (
                  <>
                    <button
                      className="mt-2 inline-flex items-center text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                      onClick={() => toggleExpand(index)}
                    >
                      {isExpanded ? (
                        <>
                          Hide Details
                          <ChevronUpIcon className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show Details
                          <ChevronDownIcon className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </button>
                    {isExpanded && (
                      <pre className="bg-gray-800 text-gray-200 p-2 mt-2 rounded text-xs overflow-auto">
                        {JSON.stringify(op, null, 2)}
                      </pre>
                    )}
                  </>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default OperationsList;
