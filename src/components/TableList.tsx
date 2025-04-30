import {useMemo, useState} from 'react';
import {
  EyeIcon,
  CircleStackIcon,
  DocumentArrowDownIcon,
  ArchiveBoxXMarkIcon,
  DocumentArrowUpIcon,
  EllipsisVerticalIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import useCloud from "../hooks/useCloud.ts";
import { Table } from "dexie";
import CloudBadge from "./shared/CloudBadge.tsx";
import Dropdown from './shared/Dropdown';
import {isInSelector} from "../utils/helpers.ts";
import clsx from "clsx"; // Adjust the path as needed

interface TableListProps {
  tables: Table[];
  selectedTable: Table | null;
  tableMode?: 'browse' | 'structure' | null;
  handleBrowse: (table: Table) => void;
  handleStructure: (table: Table) => void;
  handleExportTable: (table: Table) => void;
  handleImportTable: (table: Table) => void;
  handleTruncateTable: (table: Table) => void;
  handleExportTableAsCsv: (table: Table) => void;
}

const TableList = ({
                     tables,
                     selectedTable,
                     tableMode,
                     handleBrowse,
                     handleStructure,
                     handleExportTable,
                     handleImportTable,
                     handleTruncateTable,
                     handleExportTableAsCsv,
                   }: TableListProps) => {
  const { isTableCloud, isCloud } = useCloud();
  const [showUser, setShowUser] = useState(true);
  const [showCloud, setShowCloud] = useState(false);

  const filteredTables = useMemo(() => !isCloud ? tables :
    tables.filter((table) =>
    isTableCloud(table) ? showCloud : showUser
  ), [tables, showCloud, showUser]);

  return (
    <div>
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

      <div className="overflow-y-auto">
        <table className="min-w-full bg-gray-700">
          <thead>
          <tr>
            <th className="px-4 py-2 text-left">Table Name</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
          </thead>
          <tbody>
          {filteredTables.map((table) => (
            <tr
              onClick={(e) => {
                if (!isInSelector(e.target as Element, '.dropdown')) {
                  handleBrowse(table)
                }
              }}
              key={table.name} className={clsx([
                selectedTable?.name === table.name ? 'bg-gray-800' : 'hover:bg-[#2f3744]'  ,
                'border cursor-pointer transition-all duration-200 border-gray-600',
            ])}>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className={clsx([
                    selectedTable?.name === table.name && 'font-bold'
                  ])}>{table.name}</div>
                  {isTableCloud(table) && <CloudBadge />}
                </div>
              </td>
              <td className="px-4 py-2 space-x-2">
                <button
                  disabled={selectedTable?.name === table.name && tableMode === 'browse'}
                  aria-label={'Browse'}
                  className="inline-flex transition-all duration-100 items-center bg-blue-500 hover:bg-blue-700 disabled:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  onClick={() => handleBrowse(table)}
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  disabled={selectedTable?.name === table.name && tableMode === 'structure'}
                  aria-label={'Structure'}
                  title={'Structure'}
                  className="inline-flex transition-all duration-100 items-center bg-green-500 hover:bg-green-700 disabled:bg-green-700 text-white font-bold py-1 px-2 rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStructure(table)
                  }}
                >
                  <CircleStackIcon className="h-5 w-5" />
                </button>
                <Dropdown
                  trigger={
                    <div className="dropdown inline-flex transition-all duration-100 justify-center w-full rounded-md bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-500 focus:outline-none">
                      <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  }
                >
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleExportTable(table)}
                          className={`group flex rounded-md items-center w-full px-2 py-2 text-sm text-white ${
                            active ? 'bg-purple-500' : ''
                          }`}
                        >
                          <DocumentArrowUpIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                          Export
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleImportTable(table)}
                          className={`group flex rounded-md items-center w-full px-2 py-2 text-sm text-white ${
                            active ? 'bg-orange-500' : ''
                          }`}
                        >
                          <DocumentArrowDownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                          Import
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleExportTableAsCsv(table)}
                          className={`group flex rounded-md items-center w-full px-2 py-2 text-sm text-white ${
                            active ? 'bg-purple-500' : ''
                          }`}
                        >
                          <TableCellsIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                          Export As CSV
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleTruncateTable(table)}
                          className={`group flex rounded-md items-center w-full px-2 py-2 text-sm text-white ${
                            active ? 'bg-red-500' : ''
                          }`}
                        >
                          <ArchiveBoxXMarkIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                          Truncate
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Dropdown>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableList;
