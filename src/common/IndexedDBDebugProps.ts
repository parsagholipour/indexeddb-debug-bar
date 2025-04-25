import Dexie from "dexie";
import LayoutProps from "./Layout.ts";

export default interface IndexedDBDebugProps {
  db: Dexie;
  _barProps?: {
    isInBar?: boolean;
    orientation: 'vertical' | 'horizontal';
    layout: LayoutProps;
  }
}
