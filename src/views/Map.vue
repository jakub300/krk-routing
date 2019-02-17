<template>
  <v-app>
    <v-content>
      <div class="c-map__info">
        <v-card class="pa-2">
          <div>
            Click in two places on the map to generate route. Later you can drag markers to change
            route.
          </div>
          <div v-if="routeData">
            <div>
              Total time: {{ (routeTime / 60).toFixed(1) }} min =
              {{ (routeTime / 60 / 60).toFixed(1) }} h (generated in
              {{ routeData.data.perfDiff.toFixed(1) }} ms)
            </div>
            <ol class="mt-2">
              <li v-for="(el, index) in routeData.data.history" :key="`${el.text}-${index}`">
                {{ el.text }} ({{ (el.duration / 60).toFixed(1) }} min)
              </li>
            </ol>
          </div>
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

<script lang="ts">
/* eslint-disable global-require */

import 'leaflet/dist/leaflet.css';
import Vue from 'vue';
import { map as mapCreator, tileLayer, Map, Icon } from 'leaflet';
import MapManager, { mapManagerEvents } from '@/map/MapManager';
import Component from 'vue-class-component';

const icons = {
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
};

@Component
export default class MapComponent extends Vue {
  map?: Map;

  routeData: any = null;

  mapManager?: MapManager;

  get routeTime() {
    if (!this.routeData) {
      return 0;
    }

    const { history, time } = this.routeData.data;
    return time - history[0].start;
  }

  static fixIcon() {
    // eslint-disable-next-line
    delete (Icon.Default.prototype as any)._getIconUrl;
    // eslint-disable-next-line
    Icon.Default.mergeOptions(icons);
  }

  mounted() {
    MapComponent.fixIcon();
    const mapElement = this.$refs.map as HTMLElement;
    const map = mapCreator(mapElement).setView([50.061816, 19.93757], 13);
    this.map = map;
    tileLayer(
      'http://storage.waw1.cloud.ovh.net/v1/AUTH_17fd5d0a89ca4c518514de96757e45d6/tiles/tiles/{z}/{x}/{y}.png',
    ).addTo(map);

    (window as any).getData.then((data: any) => {
      this.mapManager = new MapManager(map, data);
    });

    mapManagerEvents.$on('route', (data: any) => {
      this.routeData = Object.freeze({ data });
    });
  }

  // beforeDestroy() {
  //   //
  // }
}
</script>

<style lang="scss">
.c-map__info {
  position: absolute;
  top: 10%;
  left: 50px;
  width: 400px;
  max-height: 80%;
  z-index: 500;

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
