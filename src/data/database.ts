// this file is used for dev environment only
import Dexie, {Table} from 'dexie';
import dexieCloud from "dexie-cloud-addon";

export interface User {
  id: string;
  name?: number;
}


export class MySubClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  users!: Table<User>;

  constructor(name, options) {
    super(name, options);
    this.version(1).stores({
      products: 'id',
      users: 'id',
      productUser: '[userId+productId],userId,productId',
    });
  }
}

const db = new MySubClassedDexie('INDEXEDDB_DEBUG_BAR', {
  addons: [
    ...(import.meta.env.VITE_DEXIE_CLOUD_ENABLED ? [dexieCloud] : [])
  ]
});
if (import.meta.env.VITE_DEXIE_CLOUD_ENABLED) {
  db.cloud.configure({
    databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_DB_URL,
    requireAuth: false,
  });
}

window.db = db;

export default db
