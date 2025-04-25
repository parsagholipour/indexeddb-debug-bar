import Dexie from "dexie";
import LayoutProps from "./Layout";

export interface IndexedDBDebugBarPropsWithoutDB {
  initialLayout?: LayoutProps;
  onLayoutChange?: (layout: LayoutProps & {prevStateBeforeMinimize: any}) => void;
}

export default interface IndexedDBDebugBarProps extends IndexedDBDebugBarPropsWithoutDB {
  db?: Dexie | string;
}
