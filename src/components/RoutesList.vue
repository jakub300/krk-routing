<template functional>
  <ul>
    <li v-for="route in props.routes" :key="route.id">
      <a href="#" @click="props.callback(route)">
        {{ route.shortName }}
      </a>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    routes: {
      type: Set,
      required: true,
    },

    callback: {
      type: Function,
      required: true,
    },
  },
};
</script>
