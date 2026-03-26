import type {App} from 'vue'
import Button from './Button.vue'
Button.install=(app:App)=>{
  app.component(<string>Button.name,Button)
}
export default Button
export * from './type'

