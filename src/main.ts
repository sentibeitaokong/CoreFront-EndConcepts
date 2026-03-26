import './assets/main.css'
//加载fontawesome核心
import {library} from '@fortawesome/fontawesome-svg-core'
//加载图标组件
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
//加载三种风格的图标库
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.css'
//将图标添加到核心中并全局定义组件
library.add(fas, far, fab)
createApp(App).mount('#app')
