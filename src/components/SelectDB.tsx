import Dexie from "dexie";
import { useEffect, useState } from "react";
import {
  CircleStackIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

/**
 * Component props
 */
interface SelectDBProps {
  /**
   * Fires when the user clicks a database row (optional)
   */
  onSelect?: (db: string) => void;
}

/** Global storage-bucket facts (identical for every DB). */
interface BucketInfo {
  origin: string;
  bucketName: string;
  isPersistent: boolean;
  durability: "strict" | "relaxed";
  quota: string; // human-readable
  expiration: string; // usually "None"
}

/** Per-database information */
interface DBInfo {
  name: string;
  version: number | null;
  objectStores: number | null;
}

const EMPTY = "–"; // en-dash placeholder

function bytesToHuman(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export default function SelectDB({ onSelect }: SelectDBProps) {
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>(null);
  const [databases, setDatabases] = useState<DBInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  /* 1️⃣  Gather bucket-level information once */
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

  /* 2️⃣  Fetch list of DB names, then populate per-DB meta */
  useEffect(() => {
    const loadDBs = async () => {
      const names = await Dexie.getDatabaseNames();
      // Map names → DBInfo (fill with placeholders first)
      const placeholders: DBInfo[] = names.map((name) => ({
        name,
        version: null,
        objectStores: null,
      }));
      setDatabases(placeholders);

      // Open each DB to read details
      await Promise.all(
        names.map(async (name) => {
          try {
            const db = new Dexie(name);
            await db.open();
            const version = db.verno;
            const objectStores = db.tables.length;
            db.close();
            setDatabases((prev) =>
              prev.map((d) =>
                d.name === name ? { ...d, version, objectStores } : d
              )
            );
          } catch (err) {
            // If DB fails to open, leave placeholders
            console.error(`Unable to open DB '${name}':`, err);
          }
        })
      );
    };

    loadDBs();
  }, []);

  /* 🔘 Handle user clicking a database */
  const handleSelect = (name: string) => {
    setSelected(name);
    onSelect?.(name);
  };

  return (
    <div className="w-full px-3 mx-auto pt-5 pb-4">
      <h2 className="text-xl font-semibold mb-3.5 flex items-center gap-2">
        Select Database
      </h2>
      <div className="w-full h-[1px] bg-white mb-5"></div>


      {/* flexible grid !!*/}
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {databases.length === 0 && (
          <li className="text-sm text-gray-500 italic">No databases found</li>
        )}
        {databases.map((db) => (
          <li key={db.name}>
            <button
              onClick={() => handleSelect(db.name)}
              className={`w-full text-left rounded-2xl border p-4 shadow transition hover:shadow-md focus:outline-none focus:ring focus:ring-blue-300/50 ${
                selected === db.name
                  ? "bg-blue-50 border-blue-400"
                  : "bg-gray-600 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-2">
                  <CircleStackIcon className="h-5 w-5" />
                  <span className="font-medium truncate">{db.name}</span>
                </span>
                {selected === db.name && <CheckIcon className="h-5 w-5" />}
              </div>

              {/* Details grid */}
              {bucketInfo && (
                <dl className="grid grid-cols-2 gap-y-1 text-xs">
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
                  <dd>{db.version ?? EMPTY}</dd>

                  <dt className="font-semibold">Object stores</dt>
                  <dd>{db.objectStores ?? EMPTY}</dd>
                </dl>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
