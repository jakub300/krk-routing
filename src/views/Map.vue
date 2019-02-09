<template>
  <v-app>
    <v-content>
      <div class="c-map__info">
        <v-card>
          Hello
        </v-card>
      </div>
      <v-container fill-height fluid pa-0>
        <v-layout fill-height>
          <div ref="map" class="c-map__map" once></div>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import 'leaflet/dist/leaflet.css';
import { map as mapCreator, tileLayer } from 'leaflet';

export default {
  mounted() {
    const map = mapCreator(this.$refs.map).setView([50.061816, 19.93757], 13);
    this.map = map;

    tileLayer(
      'http://storage.waw1.cloud.ovh.net/v1/AUTH_17fd5d0a89ca4c518514de96757e45d6/tiles/tiles/{z}/{x}/{y}.png',
    ).addTo(map);
  },
};
</script>

<style lang="scss">
.c-map__info {
  position: absolute;
  top: 10%;
  left: 10vh;
  width: 400px;
  height: 80%;

  display: flex;

  > * {
    flex: 0 0 auto;
    width: 100%;
  }
}

.c-map__map {
  flex: 0 0 auto;
  width: 100%;
}
</style>
