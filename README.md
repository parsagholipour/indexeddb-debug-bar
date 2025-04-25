[![indexeddb-debug-bar-banner](https://raw.githubusercontent.com/parsagholipour/indexeddb-debug-bar/master/public/banner.jpg)](https://parsagholipour.github.io/indexeddb-debug-bar-demo/)

# IndexedDB Debug Bar - <a href="https://parsagholipour.github.io/indexeddb-debug-bar-demo/" target="_blank">🌐 Live Demo</a>
**A tool to make IndexedDB development easier**
Browser devtools for IndexedDB are often limited, making debugging and optimizing IndexedDB painful. **IndexedDB Debug Bar** bridges this gap by providing debugging capabilities right inside your app.
A zero-config panel that lets you **browse, query and profile IndexedDB**.

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
#### React
```jsx
import IndexedDBDebugBar from 'indexeddb-debug-bar/react';

<IndexedDBDebugBar db={'your-db-name'} options={{ ...optional }} />
```
#### Vue
```vue
<script setup>
import IndexedDBDebugBar from 'indexeddb-debug-bar/vue';
</script>
<template>
  <IndexedDBDebugBar db='your-db-name' :options={{ ...optional }} />
</template>
```

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
