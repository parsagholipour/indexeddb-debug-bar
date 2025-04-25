import database from "./data/database.ts";
import IdxDebugBar from "./IndexedDBDebugBar.tsx";
import Example from "./components/example/Example.tsx";
import {useState} from "react";
import LayoutProps from "./common/Layout.ts";
import clsx from "clsx";

function App() {
  const [layout, setLayout] = useState<LayoutProps>({
    isCollapsed: false,
    position: window.innerWidth < 1000 ? 'bottom' : 'right',
  })

  return (
    <div className={'indexeddb-debug-bar'}>
      <div className={clsx([
        'w-full',
        ...(layout.position === 'right' || layout.position === 'left') ? [
          layout.position === 'left' ? 'ml-auto' : 'mr-auto',
          layout.isMinimized && 'w-full',
          !layout.isFullScreen && !layout.isCollapsed && !layout.isMinimized && 'lg:w-[50%]',
          ((!layout.isFullScreen && layout.isCollapsed) && !layout.isMinimized) && 'w-[96%]',
        ] : [
          'w-full'
        ],
      ])}>
        <Example db={database} />
      </div>
      <IdxDebugBar initialLayout={layout} onLayoutChange={setLayout} db={database}/>
    </div>
  )
}

export default App
