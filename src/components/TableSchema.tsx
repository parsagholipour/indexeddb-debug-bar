import Dexie from "dexie";

interface TableSchemaProps {
  table: Dexie.Table<any, any>;
  db: Dexie;
}

export default function TableSchema({ table }: TableSchemaProps) {
  return (
    <div className="mt-2 p-3 bg-gray-700 text-white border border-gray-600 rounded">
      <h2 className="text-lg font-semibold">
        Table: <span className="text-yellow-300">{table.name}</span>
      </h2>
      <div className="mt-4 p-2 bg-gray-800 border border-gray-600 rounded max-h-64 overflow-auto">
        <p className="text-sm text-gray-300 mb-1">Current table.schema:</p>
        <pre className="text-xs text-green-300 whitespace-pre-wrap">
          {JSON.stringify(table.schema, null, 2)}
        </pre>
      </div>
    </div>
  );
}
