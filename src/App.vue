<template>
  <div id="app">
    <h1>Paranoia</h1>
    <p>Your room name is <b>leonzalion</b>.</p>
    <template v-if="isCalendarReady">
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
        type="button"
        class="btn btn-primary mt-2"
        id="lock-schedule"
        :disabled="isScheduleLocked"
        @click="lockSchedule"
      >
        Lock Schedule
      </button>
      <p v-html="message"></p>
      <div id="screenshots">
        <button
          type="button"
          @click="takeScreenshot"
          class="btn btn-primary mb-2"
        >
          Take Screenshot(s)
        </button>
        <img
          v-for="(base64Screenshot, index) in base64Screenshots"
          :src="base64Screenshot"
          width="400"
          alt="`Screenshot #${index}`"
          :key="index"
          class="screenshot"
        />
      </div>
    </template>
    <div v-else class="spinner-border" role="status"></div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { Calendar } from '@toast-ui/vue-calendar';
import Vue from 'vue';
import cuid from 'cuid';
import dateFormat from 'dateformat';

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
    isCalendarReady: false,
    message: '',
  }),
  created() {
    ipcRenderer.on('tookScreenshot', (event, base64Screenshots) => {
      this.base64Screenshots = base64Screenshots;
    });
    ipcRenderer.on('setSchedules', (event, schedules) => {
      this.schedules = schedules;
      this.isCalendarReady = true;
    });
  },
  methods: {
    takeScreenshot() {
      ipcRenderer.invoke('takeScreenshot');
    },
    lockSchedule() {
      ipcRenderer.invoke('lockSchedule', this.schedules.map((schedule) => {
        schedule.start = dateFormat(new Date(schedule.start), 'isoDateTime');
        schedule.end = dateFormat(new Date(schedule.end), 'isoDateTime');
        schedule.isReadOnly = true;
        return schedule;
      }));
      for (let i = 0; i < this.schedules.length; ++i) {
        Vue.set(this.schedules, i, {...this.schedules[i], isReadOnly: true});
      }
      this.message = "The current events on the schedule have been locked.";
      setInterval(() => this.message = '', 2000);
    },
    onBeforeCreateSchedule(e) {
      this.schedules.push({
        id: cuid(),
        start: e.start.toDate(),
        end: e.end.toDate(),
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

.screenshot {
  margin: 10px;
}
</style>
