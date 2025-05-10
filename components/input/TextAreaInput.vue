<template>
  <div class="mb-4">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <textarea
      :id="id"
      :name="id"
      v-model="inputValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        disabled ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900',
        errorMessage ? 'border-red-500' : 'border-gray-300'
      ]"
      @input="onInput"
      @blur="$emit('blur', $event)"
    ></textarea>
    <p v-if="hint && !errorMessage" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
    <p v-if="errorMessage" class="mt-1 text-sm text-red-600">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
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
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 3
  },
  errorMessage: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'input', 'blur']);

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const onInput = (event) => {
  emit('input', event);
};
</script>
