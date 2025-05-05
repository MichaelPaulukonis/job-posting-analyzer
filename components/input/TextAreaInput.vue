<template>
  <div class="mb-4">
    <label :for="id" class="block text-sm font-medium mb-1" :class="labelClasses">
      {{ label }} 
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-required="required"
      :class="textareaClasses"
      class="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    ></textarea>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue', 'blur']);

const labelClasses = computed(() => ({
  'text-gray-700': !props.error,
  'text-red-600': props.error
}));

const textareaClasses = computed(() => ({
  'border-gray-300': !props.error && (!props.required || props.modelValue.trim()),
  'border-red-300': props.error, 
  'bg-red-50': props.error,
  'border-yellow-300': props.required && !props.modelValue.trim() && !props.error,
  'bg-yellow-50': props.required && !props.modelValue.trim() && !props.error
}));
</script>
