<template>
  <a-radio-group v-model:value="category" button-style="solid">
    <a-radio-button value="available">可用氧舱</a-radio-button>
    <a-radio-button value="ordered">已预约</a-radio-button>
  </a-radio-group>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const category = ref<'available' | 'ordered'>('available')
</script>