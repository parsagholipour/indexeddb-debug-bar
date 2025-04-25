import React, {useEffect, useRef, useState} from 'react';
import CollapseButton from "./components/CollapseButton";
import FullScreenButton from "./components/FullScreenButton";
import MinimizedIndexedDBDebugBar from "./components/MinimizedIndexedDBDebugBar.tsx";
import clsx from "clsx";
import PositionDropdown from "./components/PositionDropdown.tsx";
import IndexedDBDebugBarProps from "./common/IndexedDBDebugBarProps.ts";
import IndexedDBDebug from "./IndexedDBDebug.tsx";
import Dexie from "dexie";
import {generateDexieSchemaFromIDB} from "./utils/helpers.ts";
import SelectDB from "./components/SelectDB.tsx";
import {CircleStackIcon} from "@heroicons/react/24/outline";
import './style.css'

const defaultInitialLayout = {
  position: 'bottom' as 'top' | 'bottom' | 'left' | 'right',
  isCollapsed: true,
  isFullScreen: false,
  isMinimized: false,
}

const IndexedDBDebugBar = ({ db: _db, initialLayout, onLayoutChange }: IndexedDBDebugBarProps) => {
  const [db, setDB] = useState<string | Dexie | undefined>(_db);
  const [dexieDB, setDexieDB] = useState<Dexie | null>((typeof db !== 'string' && _db) ? db : null);
  const [layout, setLayout] = useState({
    ...defaultInitialLayout,
    ...initialLayout,
    prevStateBeforeMinimize: {
      position: 'bottom' as 'top' | 'bottom' | 'left' | 'right',
      isCollapsed: false,
      isFullScreen: false,
    },
  });

  const isRenderedOnce = useRef(false)
  useEffect(() => {
    if (!isRenderedOnce.current) {
      isRenderedOnce.current = true;
      return;
    }
    if (onLayoutChange)
      onLayoutChange(layout);
  }, [layout]);

  // Separate state for horizontal and vertical sizes:
  const [barHeight, setBarHeight] = useState(400);
  const [barWidth, setBarWidth] = useState<string | number>('50%');

  const toggleMinimize = () => {
    setLayout(prev => {
      if (prev.isMinimized) {
        return {
          ...prev,
          isMinimized: false,
          position: prev.prevStateBeforeMinimize.position,
          isCollapsed: prev.prevStateBeforeMinimize.isCollapsed,
          isFullScreen: prev.prevStateBeforeMinimize.isFullScreen,
        };
      } else {
        return {
          ...prev,
          prevStateBeforeMinimize: {
            position: prev.position,
            isCollapsed: prev.isCollapsed,
            isFullScreen: prev.isFullScreen,
          },
          isMinimized: true,
          isCollapsed: false,
          isFullScreen: false,
        };
      }
    });
  };
  const containerRef = useRef<HTMLDivElement | null>(null);


  // Updated startResizing that uses the ref for initial size measurement.
  const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isHorizontal = layout.position === 'top' || layout.position === 'bottom';
    const startPos = isHorizontal ? e.clientY : e.clientX;
    const container = containerRef.current;
    if (!container) return;
    // Get the current size from the element instead of the state.
    const startSize = isHorizontal ? container.clientHeight : container.clientWidth;

    const doDrag = (dragEvent: MouseEvent) => {
      let delta = 0;
      if (layout.position === 'top') {
        delta = dragEvent.clientY - startPos;
      } else if (layout.position === 'bottom') {
        delta = startPos - dragEvent.clientY;
      } else if (layout.position === 'left') {
        delta = dragEvent.clientX - startPos;
      } else if (layout.position === 'right') {
        delta = startPos - dragEvent.clientX;
      }
      // Ensure a minimum size (e.g., 100px)
      const newSize = Math.max(startSize + delta, 100);
      if (isHorizontal) {
        setBarHeight(newSize);
      } else {
        setBarWidth(newSize);
      }
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  // Remove size-related Tailwind classes so inline styles take precedence
  const getPositionClasses = () => {
    const base = clsx('fixed z-50 bg-gray-800 text-white shadow-lg flex');
    const sizeClass = layout.isFullScreen
      ? 'inset-0'
      : layout.isCollapsed
        ? (['top', 'bottom'].includes(layout.position) ? 'w-full' : 'h-full')
        : (['top', 'bottom'].includes(layout.position) ? 'w-full' : 'h-full');
    return clsx(
      base,
      sizeClass,
      !layout.isFullScreen && {
        'top-0 left-0 right-0': layout.position === 'top',
        'bottom-0 left-0 right-0': layout.position === 'bottom',
        'left-0 top-0 bottom-0 flex-row-reverse': layout.position === 'left',
        'right-0 top-0 bottom-0': layout.position === 'right',
      },
      {
        'flex-col': layout.position === 'top' || layout.position === 'bottom',
      } as any,
      !layout.isFullScreen && !layout.isCollapsed && 'overflow-auto',
      layout.isFullScreen && 'overflow-hidden'
    );
  };

  // Apply inline style for dynamic sizing (unless full-screen or collapsed)
  const dynamicStyle = layout.isFullScreen || layout.isCollapsed
    ? {}
    : (['top', 'bottom'].includes(layout.position)
      ? { height: !isNaN(barHeight) ? `${barHeight}px` : barHeight }
      : { width: !isNaN(barWidth as any) ? `${barWidth}px` : barWidth });

  const orientation = layout.position === 'left' || layout.position === 'right' ? 'vertical' : 'horizontal'

  const [initialized, setInitialized] = useState(typeof db !== 'string' && db !== undefined);

  useEffect(() => {
    if (typeof db === 'string') {
      setTimeout(() => {
        generateDexieSchemaFromIDB(db).then((result) => {
          const _dexieDB = new Dexie(db)
          _dexieDB.version(1).stores(result);
          setDexieDB(_dexieDB)
        })
      })
    }
  }, [db]);

  useEffect(() => {
    if (!dexieDB)
      return;
    // TODO probably on some circumstances need to open the database if it is not already open
    setInitialized(true);
  }, [dexieDB]);

  // if (!db)
  //   return <SelectDB onSelect={setDB} />

  if (!initialized && db)
    return;

  if (layout.isMinimized)
    return <MinimizedIndexedDBDebugBar toggle={toggleMinimize} />

  return (
    <div className="indexeddb-debug-bar contents">
      <div ref={containerRef} className={getPositionClasses()} style={dynamicStyle}>
        {!db && <SelectDB onSelect={setDB} />}
        {db && <>
          <div
            className={clsx(
              "flex p-2 border-gray-700",
              ['top', 'bottom'].includes(layout.position)
                ? 'flex-row justify-between'
                : 'flex-col items-center border-r h-full'
            )}
          >
            <div
              className={clsx(
                "flex gap-2 justify-end w-full",
                orientation === 'horizontal' ? 'flex-row' : 'flex-col mt-1'
              )}
            >
              <div className={clsx([
                'flex',
                orientation === 'horizontal' ? 'justify-start w-full items-center' : 'justify-center',
              ])}>
                <button className='flex items-center' onClick={() => setDB(undefined)} title={'Change Database'}
                >
                  <CircleStackIcon className="h-5 w-5"/>
                  <span className={clsx([
                    orientation === 'horizontal' ? 'inline-block ml-1' : 'hidden'
                  ])}>{dexieDB?.name}</span>
                </button>
              </div>
              <div title={'Change Dock Side'} className={'sm:contents hidden'}>
                <PositionDropdown
                  minimized={!['top', 'bottom'].includes(layout.position)}
                  value={layout.position}
                  onChange={(newPos) =>
                    setLayout((prev) => ({...prev, position: newPos}))
                  }
                />
              </div>

              <div className={clsx(
                "border-gray-600",
                orientation === 'horizontal' ? 'border-l h-full mr-3' : 'mb-2.5 border-t w-full'
              )}/>

              <button
                onClick={toggleMinimize}
                className="text-sm flex active:scale-95 justify-center text-center bg-gray-600 px-2 py-1 rounded text-white hover:text-gray-300 flex items-center"
                title="Minimize"
              >
                <span className="w-6 h-6 font-bold">—</span>
              </button>

              <FullScreenButton
                isFullScreen={layout.isFullScreen}
                setIsCollapsed={(val) => setLayout(prev => ({...prev, isCollapsed: val}))}
                setIsFullScreen={(val) => setLayout(prev => ({...prev, isFullScreen: val}))}
              />

              <CollapseButton
                isLeft={layout.position === 'left'}
                isCollapsed={layout.isCollapsed}
                setIsCollapsed={(val) => {
                  if (val && layout.isFullScreen) {
                    setLayout(prev => ({...prev, isFullScreen: false, isCollapsed: val}))
                  } else {
                    setLayout(prev => ({...prev, isCollapsed: val}))
                  }
                }}
                orientation={orientation}
              />
            </div>
          </div>

          {/* Draggable resize handle */}
          {!layout.isCollapsed && !layout.isFullScreen && (
            (['top', 'bottom'].includes(layout.position)) ? (
              <div
                className="resize-handle cursor-row-resize absolute left-0 right-0"
                style={{[layout.position === 'top' ? 'bottom' : 'top']: 0, height: '5px'}}
                onMouseDown={startResizing}
              />
            ) : (
              <div
                className="resize-handle cursor-col-resize absolute top-0 bottom-0"
                style={{[layout.position === 'left' ? 'right' : 'left']: 0, width: '5px'}}
                onMouseDown={startResizing}
              />
            )
          )}
          <IndexedDBDebug db={dexieDB} _barProps={{
            isInBar: true,
            layout,
            orientation,
          }}/>
        </>}
      </div>
    </div>
  );
};

export default IndexedDBDebugBar;
