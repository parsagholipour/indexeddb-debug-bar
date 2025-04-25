import React, { useEffect, useState } from "react";
import Dexie from "dexie";
import { exportDB } from "dexie-export-import";
import omit from "lodash.omit";

interface DatabaseTabProps {
  /** The *opened* Dexie instance */
  db: Dexie;
}

/**
 * Storage-bucket level facts – identical for every database housed under the same origin.
 */
interface BucketInfo {
  origin: string;
  bucketName: string;
  isPersistent: boolean;
  durability: "strict" | "relaxed";
  quota: string; // human-readable string
  expiration: string;
}

const EMPTY = "–";

function bytesToHuman(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

/**
 * Extracts comprehensive information from a Dexie database instance.
 */
const extractDexieInfo = (db: Dexie) => {
  const tablesInfo = db.tables.map((table) => {
    const { name, schema } = table;
    return {
      name,
      primaryKey: schema.primKey,
      indexes: schema.indexes.map((idx) => omit(idx, ["src"])),
    };
  });

  return {
    // General database properties:
    name: db.name,
    version: db.verno,
    objectStores: db.tables.length,
    // All table details:
    tables: tablesInfo,
  };
};

/**
 * A single tab that shows DB details and offers *Export/Import entire DB* actions.
 */
const DatabaseTab: React.FC<DatabaseTabProps> = ({ db }) => {
  // Bucket information shared by all DBs on the same origin
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>(null);
  // DB specific info – recalculated only once because the passed‐in db instance does not change
  const dexieDetails = extractDexieInfo(db);

  /* 1️⃣  Gather storage bucket facts on mount */
  useEffect(() => {
    (async () => {
      const [persisted, estimate] = await Promise.all([
        navigator.storage?.persisted?.() ?? Promise.resolve(false),
        navigator.storage?.estimate?.() ?? Promise.resolve({ quota: 0 }),
      ]);
      setBucketInfo({
        origin: window.location.origin,
        bucketName: "default",
        isPersistent: persisted,
        durability: persisted ? "strict" : "relaxed",
        quota: bytesToHuman(estimate.quota),
        expiration: "None",
      });
    })();
  }, []);

  // ========== 🗄 WHOLE DB Export / Import ==========
  const handleExport = async () => {
    try {
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${db.name}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const blob = await file.arrayBuffer().then((ab) => new Blob([ab]));
      await db.close();
      // Overwrite the entire DB
      await (await import("dexie-export-import")).importDB(blob, {
        overwrite: true,
      });
      window.location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      alert(
        `Import failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export / Import controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Database Information</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Export Entire DB
          </button>

          <input
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
            id="importInput"
          />
          <label
            htmlFor="importInput"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
          >
            Import Entire DB
          </label>
        </div>
      </div>

      {/* Storage-bucket details */}
      {bucketInfo && (
        <section className="p-3 bg-gray-700 text-white border border-gray-600 rounded">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="font-semibold">Name</dt>
            <dd className="truncate">{dexieDetails.name}</dd>

            <dt className="font-semibold">Origin</dt>
            <dd className="truncate">{bucketInfo.origin}</dd>

            <dt className="font-semibold">Bucket name</dt>
            <dd>{bucketInfo.bucketName}</dd>

            <dt className="font-semibold">Is persistent</dt>
            <dd>{bucketInfo.isPersistent ? "Yes" : "No"}</dd>

            <dt className="font-semibold">Durability</dt>
            <dd>{bucketInfo.durability}</dd>

            <dt className="font-semibold">Quota</dt>
            <dd>{bucketInfo.quota}</dd>

            <dt className="font-semibold">Expiration</dt>
            <dd>{bucketInfo.expiration}</dd>

            <dt className="font-semibold">Version</dt>
            <dd>{dexieDetails.version}</dd>

            <dt className="font-semibold">Object stores</dt>
            <dd>{dexieDetails.objectStores ?? EMPTY}</dd>
          </dl>
        </section>
      )}


      {/* Full extracted details (debugging) */}
      <section className="p-3 bg-gray-700 text-white border border-gray-600 rounded">
        <h2 className="text-lg font-semibold">Full Extracted Details</h2>
        <div className="mt-4 p-2 bg-gray-800 border border-gray-600 rounded max-h-64 overflow-auto">
          <pre className="text-xs text-green-300 whitespace-pre-wrap">
            {JSON.stringify(dexieDetails, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default DatabaseTab;
