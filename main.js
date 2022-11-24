import App from './App'

// #ifndef VUE3
import Vue from 'vue'

Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
Vue.filter('formatCount', function(value) {
	if (value >= 10000 && value <= 100000000) {
		value /= 10000;
		return value.toFixed(1) + '万';
	} else if (value > 100000000) {
		value /= 100000000;
		return value.toFixed(1) + '亿';
	} else {
		return value;
	}
})
Vue.filter('formatTime', function(value) {
	let date = new Date(value);
	return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	return {
		app
	}
}
// #endif
