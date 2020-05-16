import Vue from 'vue'
import App from './App.vue'
import io from 'socket.io-client';

Vue.config.productionTip = false

new Vue({
  socket: io('https://paranoia-app.herokuapp.com'),
  render: h => h(App),
}).$mount('#app')
