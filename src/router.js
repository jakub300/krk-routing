import Vue from 'vue';
import Router from 'vue-router';
import Vuetify from './views/Vuetify';
import Map from './views/Map';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', name: 'map', component: Map },
    { path: '/vuetify', name: 'vuetify', component: Vuetify },
  ],
});
