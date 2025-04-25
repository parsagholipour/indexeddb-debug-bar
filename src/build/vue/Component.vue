<template>
  <div class="dexie-debug-bar-wrapper"></div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onBeforeUnmount,
  watch,
  ref,
  type PropType,
} from 'vue';
import Dexie from 'dexie';
import DexieDebugBarCore from '../core';
import type IndexedDBDebugBarProps from '../../common/IndexedDBDebugBarProps';

export default defineComponent({
  name: 'IndexeddbDebugBar',

  props: {
    db: {
      type: Object as PropType<Dexie | string>,
      required: true,
    },

    /** Options forwarded to the React debug bar */
    options: {
      type: Object as PropType<IndexedDBDebugBarProps>,
      default: () => ({} as IndexedDBDebugBarProps),
    },

    /** Whether the bar is visible */
    visible: {
      type: Boolean,
      default: true,
    },
  },

  setup(props) {
    const debugBarCore = ref<DexieDebugBarCore | null>(null);

    onMounted(() => {
      debugBarCore.value = new DexieDebugBarCore(props.db, props.options);
      props.visible ? debugBarCore.value.show() : debugBarCore.value.hide();
    });

    onBeforeUnmount(() => {
      debugBarCore.value?.destroy();
    });

    watch(
        () => props.options,
        (opt) => debugBarCore.value?.updateOptions(opt),
        { deep: true }
    );

    watch(
        () => props.visible,
        (v) => (v ? debugBarCore.value?.show() : debugBarCore.value?.hide())
    );

    return {};
  },
});
</script>
