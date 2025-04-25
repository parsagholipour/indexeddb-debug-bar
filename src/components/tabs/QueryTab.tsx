import {useContext, useState} from 'react';
import MassUpdateModal from "../MassUpdateModal.tsx";
import indexedDBDebugBarContext from "../../contexts/IndexedDBDebugBarContext.tsx";
import {TrashIcon} from "@heroicons/react/24/solid";
import clsx from "clsx";

/** Extended operator set */
type Operator =
  | 'equals'
  | 'notEquals'
  | 'above'
  | 'aboveOrEqual'
  | 'below'
  | 'belowOrEqual'
  | 'anyOf'
  | 'noneOf'
  | 'between'
  | 'startsWith'
  | 'startsWithIgnoreCase'
  | 'equalsIgnoreCase'
  | 'isNull'
  | 'isNotNull';

type Logic = 'AND' | 'OR';

interface ConditionNode {
  type: 'condition';
  field: string;
  operator: Operator;
  /** The raw string the user enters (could be multiple values for anyOf, etc.) */
  value: string;
}

interface GroupNode {
  type: 'group';
  logic: Logic;
  children: QueryNode[];
}

type QueryNode = ConditionNode | GroupNode;

/** Helpers to create empty nodes */
const createEmptyCondition = (): ConditionNode => ({
  type: 'condition',
  field: '',
  operator: 'equals',
  value: '',
});

const createEmptyGroup = (logic: Logic): GroupNode => ({
  type: 'group',
  logic,
  children: [],
});

export default function AdvancedQueryBuilder({orientation}:{orientation: 'horizontal' | 'vertical'}) {
  const {db} = useContext(indexedDBDebugBarContext)!;
  // The table we're querying
  const [selectedTableName, setSelectedTableName] = useState('');
  const selectedTable = db.tables.find((t) => t.name === selectedTableName) || null;

  // Our top-level "group"
  const [rootNode, setRootNode] = useState<GroupNode>(
    createEmptyGroup('AND')
  );

  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [massUpdateOpen, setMassUpdateOpen] = useState(false);

  /** Full list of supported operators */
  const operators: Operator[] = [
    'equals',
    'notEquals',
    'above',
    'aboveOrEqual',
    'below',
    'belowOrEqual',
    'anyOf',
    'noneOf',
    'between',
    'startsWith',
    'startsWithIgnoreCase',
    'equalsIgnoreCase',
    'isNull',
    'isNotNull',
  ];

  /** Parse user’s input for operators that need multiple or special values */
  function parseValue(condition: ConditionNode): any {
    const { operator, value } = condition;

    // "isNull" / "isNotNull": no value needed
    if (operator === 'isNull' || operator === 'isNotNull') {
      return null;
    }

    // "anyOf", "noneOf", "between" expect multiple values separated by commas
    if (operator === 'anyOf' || operator === 'noneOf') {
      // e.g. `10,"Alice",42`
      // Split by comma and parse each token (quoted string or integer)
      return value
        .split(',')
        .map((str) => str.trim())
        .map((token) => parseSingleValue(token));
    }
    if (operator === 'between') {
      // e.g. `10,20` or `"a","z"`
      const parts = value.split(',').map((s) => s.trim());
      if (parts.length < 2) {
        throw new Error(`"between" requires two values, e.g. 10,20`);
      }
      const lower = parseSingleValue(parts[0]);
      const upper = parseSingleValue(parts[1]);
      return [lower, upper];
    }

    // Otherwise, parse a single value
    return parseSingleValue(value);
  }

  /** Parse a single token: if it's in quotes => string, else => integer */
  function parseSingleValue(val: string): number | string {
    if (val.startsWith('"') && val.endsWith('"')) {
      return val.slice(1, -1);
    } else {
      if (isNaN(val))
        return val;
      else {
        return parseFloat(val);
      }
    }
  }

  /**
   * Count the total number of condition nodes in the entire tree
   */
  function countConditions(node: QueryNode): number {
    if (node.type === 'condition') return 1;
    // otherwise, it's a group
    return node.children.reduce((sum, child) => sum + countConditions(child), 0);
  }

  /**
   * Check if the single condition is also something Dexie can do index-based,
   * i.e., no "isNull", no "isNotNull", no "anyOf" with strings if not indexed, etc.
   */
  function buildSingleConditionQuery(cond: ConditionNode) {
    if (!selectedTable) return null;
    const { field, operator } = cond;

    // Dexie doesn't have isNull or isNotNull directly.
    if (operator === 'isNull' || operator === 'isNotNull') return null;

    // We'll try to parse the user value:
    let parsed: any;
    try {
      parsed = parseValue(cond);
    } catch {
      return null;
    }

    // Then see if there's a matching method
    const chain = selectedTable.where(field);
    if (!chain) return null;
    if (!chain[operator]) return null;

    // e.g. chain.equals(parsed)
    try {
      return chain[operator](...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // e.g. error if Dexie says "field not indexed" or invalid usage
      return null;
    }
  }

  /**
   * Evaluate a single row against a single condition in memory.
   * This covers all operators including those Dexie doesn’t do index-based (like isNull).
   */
  function evaluateCondition(row: any, cond: ConditionNode): boolean {
    const { field, operator } = cond;

    // "isNull" => rowVal == null
    // "isNotNull" => rowVal != null
    if (operator === 'isNull') {
      return row[field] == null; // covers null or undefined
    }
    if (operator === 'isNotNull') {
      return row[field] != null;
    }

    // For everything else, parse the user’s value
    let parsed: any;
    try {
      parsed = parseValue(cond);
    } catch {
      // can't parse => fail
      return false;
    }
    const rowVal = row[field];

    // "anyOf" => rowVal must be in array
    // "noneOf" => rowVal must not be in array
    // "between" => rowVal must be >= lower && <= upper
    switch (operator) {
      case 'equals':
        return rowVal === parsed;
      case 'notEquals':
        return rowVal !== parsed;
      case 'above':
        return rowVal > parsed;
      case 'aboveOrEqual':
        return rowVal >= parsed;
      case 'below':
        return rowVal < parsed;
      case 'belowOrEqual':
        return rowVal <= parsed;
      case 'anyOf':
        return Array.isArray(parsed) && parsed.includes(rowVal);
      case 'noneOf':
        return Array.isArray(parsed) && !parsed.includes(rowVal);
      case 'between':
        if (!Array.isArray(parsed) || parsed.length < 2) return false;
        const [low, high] = parsed;
        return rowVal >= low && rowVal <= high;
      case 'startsWith':
        if (typeof rowVal !== 'string') return false;
        return rowVal.startsWith(parsed);
      case 'startsWithIgnoreCase':
        if (typeof rowVal !== 'string') return false;
        return rowVal.toLowerCase().startsWith(String(parsed).toLowerCase());
      case 'equalsIgnoreCase':
        if (typeof rowVal !== 'string') return false;
        return rowVal.toLowerCase() === String(parsed).toLowerCase();
    }
    return false;
  }

  /**
   * Evaluate a row against a QueryNode (could be a group or condition).
   */
  function evaluateNode(row: any, node: QueryNode): boolean {
    if (node.type === 'condition') {
      return evaluateCondition(row, node);
    } else {
      // group
      if (node.logic === 'AND') {
        return node.children.every((child) => evaluateNode(row, child));
      } else {
        // OR
        return node.children.some((child) => evaluateNode(row, child));
      }
    }
  }

  /**
   * Recursively traverse the tree to find the single ConditionNode (if any).
   */
  function getSingleConditionNode(node: QueryNode): ConditionNode | null {
    if (node.type === 'condition') return node;
    // If group, we either find exactly one condition total or none
    for (const child of node.children) {
      const found = getSingleConditionNode(child);
      if (found) return found;
    }
    return null;
  }

  /** Run the query! */
  async function runQuery() {
    setError(null);
    setResults([]);

    if (!selectedTable) {
      setError('No table selected.');
      return;
    }

    try {
      const totalCond = countConditions(rootNode);

      if (totalCond === 0) {
        setError('No conditions. The result would be everything, but let’s just load it anyway!');
        // Optionally, you could do table.toArray() here
        const allData = await selectedTable.toArray();
        setResults(allData);
        return;
      }

      // If exactly one condition, see if Dexie can handle it with an index
      let finalResults: any[];
      if (totalCond === 1) {
        const singleCond = getSingleConditionNode(rootNode);
        if (singleCond) {
          const dexieQuery = buildSingleConditionQuery(singleCond);
          if (dexieQuery) {
            // Dexie can do it
            finalResults = await dexieQuery.toArray();
            setResults(finalResults);
            return;
          }
        }
      }

      // Otherwise => do an in-memory filter
      const allRows = await selectedTable.toArray();
      finalResults = allRows.filter((row) => evaluateNode(row, rootNode));
      setResults(finalResults);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unknown error');
    }
  }

  // A small function to replace a node with an updated copy in the tree
  function replaceNode(tree: QueryNode, target: QueryNode, replacement: QueryNode): QueryNode {
    if (tree === target) {
      return replacement;
    }
    if (tree.type === 'group') {
      return {
        ...tree,
        children: tree.children.map((child) => replaceNode(child, target, replacement)),
      };
    }
    return tree;
  }

  function updateNode(current: QueryNode, updated: QueryNode) {
    const newRoot = replaceNode(rootNode, current, updated);
    setRootNode(newRoot as GroupNode); // root is always group
  }

  function removeNodeFromTree(tree: QueryNode, target: QueryNode): QueryNode {
    if (tree.type === 'group') {
      return {
        ...tree,
        children: tree.children
          .filter((child) => child !== target)
          .map((child) => removeNodeFromTree(child, target)),
      };
    }
    // If it's condition, nothing to remove if it doesn't match
    return tree;
  }

  function removeNode(node: QueryNode) {
    if (node === rootNode) return; // do not remove the root
    const newRoot = removeNodeFromTree(rootNode, node);
    setRootNode(newRoot as GroupNode);
  }

  function renderGroup(group: GroupNode) {
    return (
      <div style={{ marginLeft: '1rem', borderLeft: '2px dashed gray', paddingLeft: '0.5rem' }}>
        <div className="mb-2 flex items-center space-x-2">
          <span>Group:</span>
          <select
            value={group.logic}
            onChange={(e) =>
              updateNode(group, { ...group, logic: e.target.value as Logic })
            }
            className="bg-gray-700 text-white px-2 py-1 rounded"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <button
            onClick={() => {
              const newCond = createEmptyCondition();
              updateNode(group, {
                ...group,
                children: [...group.children, newCond],
              });
            }}
            className="bg-green-600 py-1 hover:bg-green-700 text-white px-2 rounded"
          >
            + Condition
          </button>
          <button
            onClick={() => {
              const newGrp = createEmptyGroup('AND');
              updateNode(group, {
                ...group,
                children: [...group.children, newGrp],
              });
            }}
            className="bg-blue-600 py-1 hover:bg-blue-700 text-white px-2 rounded"
          >
            + Subgroup
          </button>
          {group !== rootNode && (
            <button
              onClick={() => removeNode(group)}
              className="bg-red-600 py-1 hover:bg-red-700 text-white px-2 rounded"
            >
              Remove Group
            </button>
          )}
        </div>
        <div style={{ marginLeft: '1rem' }}>
          {group.children.length === 0 && <p className="text-sm text-gray-300">No children yet</p>}
          {group.children.map((child, idx) => (
            <div key={idx} className="mb-4">
              {child.type === 'group'
                ? renderGroup(child)
                : renderCondition(child)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderCondition(cond: ConditionNode) {
    return (
      <div className={clsx([
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'items-end'
      ])} style={{ marginLeft: '1rem', borderLeft: '2px solid gray', paddingLeft: '0.5rem' }}>
        <div>
          <label className="block text-sm">Field:</label>
          <input
            value={cond.field}
            onChange={(e) => updateNode(cond, { ...cond, field: e.target.value })}
            className="bg-gray-700 text-white lg:w-auto w-[120px] px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Operator:</label>
          <select
            value={cond.operator}
            onChange={(e) =>
              updateNode(cond, { ...cond, operator: e.target.value as Operator })
            }
            className="bg-gray-700 text-white lg:w-auto w-[120px] px-2 py-1 rounded"
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        {/* If user picks isNull/isNotNull, we can hide the value input */}
        {cond.operator !== 'isNull' && cond.operator !== 'isNotNull' && (
          <div>
            <label className="block text-sm">Value:</label>
            <input
              title={'e.g. "Bob" or 42; for anyOf => 10,"Bob"'}
              value={cond.value}
              onChange={(e) => updateNode(cond, { ...cond, value: e.target.value })}
              placeholder='e.g. "Bob" or 42; for anyOf => 10,"Bob"'
              className="bg-gray-700 text-white lg:w-auto w-[120px] px-2 py-1 rounded"
            />
          </div>
        )}

        <div>
          <button
            style={{ height: '29px' }}
            onClick={() => removeNode(cond)}
            className="bg-red-600 flex items-center hover:bg-red-700 text-white px-4 rounded mt-1"
          >
            <TrashIcon width={20} />
          </button>
        </div>
      </div>
    );
  }

  async function handleMassUpdateSubmit(fieldsToUpdate: Record<string, any>) {
    if (!selectedTable) return;
    try {
      // We'll need the primary key from Dexie schema if we want to do .update(key, changes).
      // Example: let’s assume primary key is "id", or we can detect it from the table schema
      const primaryKey = selectedTable.schema?.primKey?.keyPath || 'id';

      // Option A: One-by-one updating
      for (const row of results) {
        const keyValue = row[primaryKey];
        await selectedTable.update(keyValue, fieldsToUpdate);
      }

      await runQuery()
    } catch (err) {
      console.error('Mass update failed:', err);
      alert('Mass update failed: ' + (err as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Query Builder</h1>

      <div className="my-4">
        <label className="block text-sm">Select Table:</label>
        <select
          value={selectedTableName}
          onChange={(e) => setSelectedTableName(e.target.value)}
          className="bg-gray-700 text-white px-2 py-1 rounded"
        >
          <option value="">-- Choose a Table --</option>
          {db.tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name}
            </option>
          ))}
        </select>
      </div>

      {/* Render the root group */}
      <div className="border border-gray-500 p-2">
        {renderGroup(rootNode)}
      </div>

      {/* Buttons */}
      <div className="my-4 flex gap-2">
        {/* Run Query */}
        <button
          onClick={runQuery}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Run Query
        </button>
        {/* MASS UPDATE BUTTON */}
        {!!results?.length && <button
          onClick={() => setMassUpdateOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          Mass Update
        </button>}
      </div>

      {/* Error */}
      {error && <p className="text-red-300 mb-2">{error}</p>}

      {/* Results */}
      {results.length > 0 ? (
        <div className="overflow-x-auto max-h-48 border border-gray-500">
          <table className="min-w-full bg-gray-700">
            <thead>
            <tr>
              {Array.from(new Set(results.flatMap(Object.keys))).map((key) => (
                <th key={key} className="px-4 py-2 text-left">
                  {key}
                </th>
              ))}
            </tr>
            </thead>
            <tbody>
            {results.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-600">
                {Array.from(new Set(results.flatMap(Object.keys))).map((key) => (
                  <td key={key} className="px-4 py-2">
                    {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <p>No results.</p>
      )}

      {/* MASS UPDATE MODAL */}
      {selectedTable && (
        <MassUpdateModal
          isOpen={massUpdateOpen}
          onRequestClose={() => setMassUpdateOpen(false)}
          tableName={selectedTable.name}
          onSubmit={handleMassUpdateSubmit}
        />
      )}
    </div>
  );
}
