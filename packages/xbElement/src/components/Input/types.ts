export interface InputProps {
  type: string;
  modelValue:string;
  size?:'larger'|'small';
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showPassword?: boolean;
  readonly?: boolean;
  autoFocus?: boolean;
  form?:string;
  autocomplete?:string;
}

export interface InputEmits {
  (e:'update:modelValue',value:string):void
  (e:'input',value:string):void
  (e:'change',value:string):void
  (e:'focus',value:FocusEvent):void
  (e:'blur',value:FocusEvent):void
  (e:'clear'):void
}

export interface InputInstance{
  ref:HTMLInputElement|HTMLTextAreaElement;
}
