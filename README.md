 [![indexeddb-debug-bar-banner](https://raw.githubusercontent.com/parsagholipour/indexeddb-debug-bar/master/public/banner.jpg)](https://parsagholipour.github.io/indexeddb-debug-bar-demo/)

# IndexedDB Debug Bar - <a href="https://parsagholipour.github.io/indexeddb-debug-bar-demo/" target="_blank">🌐 Live Demo</a>
**A tool to make IndexedDB development easier**
Browser devtools for IndexedDB are often limited, making debugging and optimizing IndexedDB painful. **IndexedDB Debug Bar** bridges this gap by providing debugging capabilities right inside your app.
A zero-config panel that lets you **browse, query and profile IndexedDB**.

[![indexeddb-debug-bar-banner](https://raw.githubusercontent.com/parsagholipour/indexeddb-debug-bar/master/public/screenshot.png)](https://parsagholipour.github.io/indexeddb-debug-bar-demo/)

## 🚀 Quick Start

### Installation

```bash
npm i indexeddb-debug-bar
```

### Usage

```js
import IndexedDBDebugBar from 'indexeddb-debug-bar';

new IndexedDBDebugBar('your-db-name');
```

#### Using Dexie.js Instance (Optional)
You can optionally use a Dexie.js instance to view your app’s transaction history and performance. There's also Dexie Cloud support, which lets you debug your cloud app and view activity log for sync operations.



```js
import IndexedDBDebugBar from 'indexeddb-debug-bar';
import Dexie from "dexie";

const db = new Dexie("MyDatabase");
db.version(1).stores({
  items: "++id, name",
});
new IndexedDBDebugBar(db);
```

### Framework Adapters
#### React - <a href="https://stackblitz.com/edit/vitejs-vite-kmja6i3c?file=src%2FApp.tsx" target="_blank">LIVE DEMO</a>
```jsx
import IndexedDBDebugBar from 'indexeddb-debug-bar/react';

<IndexedDBDebugBar db={'your-db-name'} options={{ ...optional }} />
```
#### Vue - <a href="https://stackblitz.com/edit/vitejs-vite-jihqnvv6?file=src%2FApp.vue" target="_blank">LIVE DEMO</a>
```vue
<script setup>
import IndexedDBDebugBar from 'indexeddb-debug-bar/vue';
</script>
<template>
  <IndexedDBDebugBar db='your-db-name' :options={{ ...optional }} />
</template>
```

#### CDN - <a href="https://codesandbox.io/p/sandbox/z63k34" targe="_blank">LIVE DEMO</a>
```html
<script src="https://cdn.jsdelivr.net/npm/indexeddb-debug-bar@latest/dist/browser/indexeddb-debug-bar-browser.umd.js"></script>
<script>
    new IndexedDBDebugBar();
</script>
```

#### Browser Dev Tool
<img width="1261" height="205" alt="image" src="https://github.com/user-attachments/assets/bf870c3e-2ca3-463a-b782-a017c6a556d8" />

To load the IndexedDB Debug Bar on any website(not using <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP" targe="_blank">CSP</a>), run the following command in your browser’s developer console:
```js
import('https://cdn.jsdelivr.net/npm/indexeddb-debug-bar/dist/idb.js')
```




### Dexie Cloud Demo

https://github.com/user-attachments/assets/664cd39b-2693-4157-9adb-2abc0efc857f



## Features

- **CRUD Operations with Inline Editing:** View, create, update, and delete entries directly from the interface.
- **GUI Query Builder:** Build and test queries visually.
- **Import & Export:** Import and export single tables or the entire database.
- **Query Performance Insights:** Logs showing query durations to help optimize your database interactions.

### 🌟 Special Dexie.js Features

- **Transaction History Logs:** Keep track of transactions and roll back effortlessly.
- **Dexie.js Cloud Devtools:** Enhanced debugging and development experience for Dexie.js Cloud integrations.

## API & Options

### Component Props

| Prop               | Type                                                                 | Default                                                                                    | Description                                                                                       |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `db`               | `Dexie \| string`                                                    | **required**                                                                               | Dexie instance or database name to attach the Debug Bar to                                        |
| `initialLayout`    | `Layout`                                                             | `{ position: 'left', isCollapsed: false, isFullScreen: false, isMinimized: false }`        | Initial layout settings for the bar                                                               |

### `Layout` Shape (for `initialLayout`)

| Option         | Type                                            | Default    | Description                                                      |
| -------------- | ----------------------------------------------- |------------| ---------------------------------------------------------------- |
| `position`     | `'top'` \| `'bottom'` \| `'left'` \| `'right'` | `'bottom'` | Where to dock the Debug Bar on the viewport                      |
| `isCollapsed`  | `boolean`                                       | `true`     | If `true`, only the bar’s header is shown (content is hidden)    |
| `isFullScreen` | `boolean`                                       | `false`    | If `true`, the bar expands to cover the entire viewport          |
| `isMinimized`  | `boolean`                                       | `false`    | If `true`, the bar is minimized to an icon (click to restore)    |


## License

MIT

## 🤝 Contribution

Feel free to contribute to the project by creating issues or pull requests. Contributions, bug reports, and feature requests are welcome!
