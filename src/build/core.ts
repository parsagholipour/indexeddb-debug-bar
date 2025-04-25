import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import IdxDebugBar from "../IndexedDBDebugBar";
import { IndexedDBDebugBarPropsWithoutDB } from "../common/IndexedDBDebugBarProps";
import Dexie from "dexie";
import '../style.css';

export default class IndexedDBDebugBarCore {
  public db?: Dexie | string;
  public options?: IndexedDBDebugBarPropsWithoutDB;
  public target: HTMLElement;
  public root: Root;

  constructor(db?: Dexie | string, options?: IndexedDBDebugBarPropsWithoutDB) {
    this.db = db;
    this.options = options;

    // Find or create the target element
    const target = document.getElementById('indexeddb-debug-bar') || document.createElement('div');
    target.id = 'indexeddb-debug-bar';
    target.className = 'indexeddb-debug-bar';
    document.body.appendChild(target);
    this.target = target;

    // Create the React root and render the component using React.createElement
    this.root = createRoot(this.target);
    this.root.render(
      React.createElement(IdxDebugBar, { ...this.options, db: this.db })
    );
  }

  /**
   * Unmounts the component and removes the debug bar from the DOM.
   */
  destroy() {
    this.root.unmount();
    if (this.target.parentNode) {
      this.target.parentNode.removeChild(this.target);
    }
  }

  /**
   * Update the debug bar with new options.
   * @param newOptions - The new options for the DexieDebugBar.
   */
  updateOptions(newOptions: IndexedDBDebugBarPropsWithoutDB) {
    this.options = newOptions;
    this.root.render(
      React.createElement(IdxDebugBar, { ...this.options, db: this.db })
    );
  }

  /**
   * Hides the debug bar.
   */
  hide() {
    this.target.style.display = 'none';
  }

  /**
   * Shows the debug bar.
   */
  show() {
    this.target.style.display = '';
  }

  /**
   * Toggles the visibility of the debug bar.
   */
  toggle() {
    if (this.target.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
}
