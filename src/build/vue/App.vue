<script setup>
import database from "../../data/database";
import Component from './Component.vue';

</script>
<template>
  <Component :db="database" :options="{initialLayout: {
    isCollapsed: false,
    position: 'right',
  }}" :visible="true" />
</template>
