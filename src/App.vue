<template>
  <div id="app">
    <h1>Paranoia</h1>
    <calendar
      style="height: 800px;"
      :taskView="false"
      view="week"
      :scheduleView="['time']"
      :schedules="schedules"
      @beforeCreateSchedule="onBeforeCreateSchedule"
      @beforeUpdateSchedule="onBeforeUpdateSchedule"
      @beforeDeleteSchedule="onBeforeDeleteSchedule"
    />
    <button
      id="lock-schedule"
      :disabled="isScheduleLocked"
      @click="lockSchedule"
    >
      Lock Schedule
    </button>
    <div id="screenshots">
      <button @click="takeScreenshot">Take Screenshot(s)</button>
      <img
        v-for="(base64Screenshot, index) in base64Screenshots"
        :src="base64Screenshot"
        width="400"
        alt="`Screenshot #${index}`"
        :key="index"
      />
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { Calendar } from '@toast-ui/vue-calendar';
import Vue from 'vue';
import cuid from 'cuid';
import 'tui-calendar/dist/tui-calendar.css';

import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';

export default {
  name: 'App',
  components: {
    Calendar
  },
  data: () => ({
    base64Screenshots: [],
    schedules: [],
    isScheduleLocked: false,
  }),
  created() {
    ipcRenderer.on('tookScreenshot', (event, base64Screenshots) => {
      console.log(base64Screenshots.length);
      this.base64Screenshots = base64Screenshots;
    });
  },
  methods: {
    takeScreenshot() {
      ipcRenderer.invoke('takeScreenshot');
    },
    lockSchedule() {
      ipcRenderer.invoke('lockSchedule', this.schedules);
    },
    onBeforeCreateSchedule(e) {
      this.schedules.push({
        id: cuid(),
        start: e.start,
        end: e.end,
        title: e.title,
        category: 'time',
      });
    },
    onBeforeDeleteSchedule(e) {
      this.schedules = this.schedules.filter((schedule) => {
        console.log(schedule.id, e.schedule.id);
        return schedule.id !== e.schedule.id;
      });
    },
    onBeforeUpdateSchedule(e) {
      const index = this.schedules.findIndex((schedule) => schedule.id === e.schedule.id);
      Vue.set(this.schedules, index, {...this.schedules[index], ...e.changes});
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#screenshots {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
