import {useCallback, useEffect, useState} from "react";
import Dexie from "dexie";
import {SyncEvent} from "../common/SyncEvent.ts";

export default function useWatchCloud(db: Dexie) {
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);

  const addEvent = useCallback(({message}: {message: string}) => {
    setSyncEvents(old => {
      return [...old, {message , date: new Date().getTime()}]
    });
  }, [])

  useEffect(() => {
    if (!db.cloud?.options) return;

    const subscriptions = [
      db.cloud.syncState.subscribe({
        next(x) {
          console.log('syncState next', x);
        },
        error(err) {
          console.log('syncState error', err);
        },
        complete() {
          console.log('syncState complete');
        }
      }),
      db.cloud.webSocketStatus.subscribe({
        next(x) {
          addEvent({message: 'Websocket Status Change: ' + x});
        },
        error() {
          addEvent({message: 'Websocket Status Error' });
        },
      }),
      db.cloud.invites.subscribe({
        next(x) {
          if (x.length)
            addEvent({message: 'New Invitations: ' + x.map(i => i.id).join(',')});
        },
      }),
      db.cloud.events.syncComplete.subscribe({
        next() {
          addEvent({message: 'Sync completed successfully.'});
        },
        error() {
          addEvent({message: 'Sync failed.'});
        },
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [db.cloud]);

  return {
    syncEvents,
  }
}
