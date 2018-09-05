const DashboardPage = {
  template: `<div>
    <dashboard-view :name="$route.params.name" :key="$route.params.name" />
  </div>`,
}

Vue.component('dashboard-view', {
  props: {
    name: String,
  },
  data() {
    return {
      widgets: [],
      error: null,
      loading: false,
    }
  },
  created() {
    this.loading = true
    firebase
      .database()
      .ref(`pages/${this.name}`)
      .on(
        'value',
        snapshot => {
          const val = snapshot.val()
          this.loading = false
          this.widgets = (val && val.widgets) || {}
        },
        error => {
          this.loading = false
          this.error = `Firebase error: ${error}`
        }
      )
  },
  template: `<div>
    <div class="dashboard-header">
      <div>
        Dashboard <strong>{{name}}</strong>
        <span v-if="loading">(loading…)</span>
        <span v-if="error">(error: {{error}})</span>
      </div>
    </div>
    <div class="dashboard-contents">
      <div class="widget" v-for="(widget, id) of widgets" :key="id" :style="widget.style">
        <dashboard-widget :name="id" />
      </div>
    </div>
  </div>`,
})

Vue.component('dashboard-widget', {
  props: {
    name: String,
  },
  data() {
    return {
      data: {},
      error: null,
      loading: false,
    }
  },
  created() {
    this.loading = true
    firebase
      .database()
      .ref(`widgets/${this.name}`)
      .on(
        'value',
        snapshot => {
          const val = snapshot.val()
          this.loading = false
          this.data = val || {}
        },
        error => {
          this.loading = false
          this.error = `Firebase error: ${error}`
        }
      )
  },
  template: `<div class="dashboard-widget">
    <div v-if="loading" class="dashboard-widget-loading">
      <div>Loading {{name}}</div>
    </div>
    <div v-else-if="error" class="dashboard-widget-error">
      <div>Error loading {{name}}: {{error}}</div>
    </div>
    <div v-else class="dashboard-widget-view">
      <div class="dashboard-widget-title">
        <strong>{{name}}</strong><span v-if="data.updated"> — last updated {{new Date(data.updated).toString()}}</span>
      </div>
      <div class="dashboard-widget-contents">
        <div v-html="data.contents" class="dashboard-widget-contents-viewport" />
      </div>
    </div>
  </div>`,
})

const routes = [
  { path: '/pages/:name', component: DashboardPage },
  { path: '/', redirect: '/pages/main' },
]

const router = new VueRouter({
  routes,
})

const vueApp = new Vue({
  router,
  template: `<div>
    <template v-if="checked">
      <template v-if="authenticated"><router-view></router-view></template>
      <template v-if="!authenticated">
        <h1>Please authenticate!</h1>
        <p>For engineers: Sign in with Google — <button @click="authenticate">Click this button</button></p>
        <form @submit="submit($event)">
          <p>
            For dashboard screen:
            <input type="email" name="email" ref="email" />
            <input type="password" name="password" ref="password" />
            <button :disabled="signingIn">{{ signingIn ? 'Wait pls' : 'Try it' }}</button>
          </p>
        </form>
      </template>
    </template>
    <template v-if="!checked">
      <h1>Checking authentication state...</h1>
    </template>
  </div>`,
  el: '#app',
  data: {
    authenticated: false,
    checked: false,
    user: null,
    signingIn: false,
  },
  methods: {
    authenticate() {
      var provider = new firebase.auth.GoogleAuthProvider()
      provider.setCustomParameters({ hd: 'taskworld.com' })
      firebase.auth().signInWithPopup(provider)
    },
    async submit(e) {
      e.preventDefault()
      this.signingIn = true
      try {
        await firebase
          .auth()
          .signInWithEmailAndPassword(
            this.$refs.email.value,
            this.$refs.password.value
          )
      } catch (e) {
        window.alert(`Cannot sign in: ${e}`)
      } finally {
        this.signingIn = false
      }
    },
  },
  mounted() {
    firebase.auth().onAuthStateChanged(
      user => {
        this.checked = true
        this.authenticated = !!user
        this.user = user
      },
      error => {
        window.alert(`Cannot check auth state: ${error}`)
      }
    )
  },
})
