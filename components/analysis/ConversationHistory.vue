<template>
  <div class="conversation-history">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Conversation History</h3>
      <button
        v-if="canToggle"
        @click="isExpanded = !isExpanded"
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        {{ isExpanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <div v-if="!conversation || conversation.messages.length === 0" class="text-gray-500 text-sm">
      No conversation history yet. Generate a cover letter to start a conversation.
    </div>

    <div v-else-if="isExpanded || !canToggle" class="space-y-4 max-h-96 overflow-y-auto">
      <div 
        v-for="(message, index) in conversation.messages" 
        :key="index"
        class="message-item border-l-4 pl-4 py-2"
        :class="getMessageClasses(message.role)"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-sm" :class="getRoleClasses(message.role)">
            {{ getRoleDisplayName(message.role) }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatTimestamp(message.timestamp) }}
          </span>
        </div>

        <div v-if="message.role === 'user'" class="text-sm text-gray-700">
          <div v-if="message.metadata?.instructions" class="mb-2">
            <span class="font-medium">Instructions:</span> {{ message.metadata.instructions }}
          </div>
          <div v-else>
            {{ message.content }}
          </div>
        </div>

        <div v-else-if="message.role === 'assistant'" class="text-sm">
          <div class="max-h-32 overflow-y-auto">
            <pre class="whitespace-pre-wrap font-sans">{{ message.content.substring(0, 200) }}<span v-if="message.content.length > 200">...</span></pre>
          </div>
          <button 
            v-if="message.content.length > 200"
            @click="expandMessage(index)"
            class="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            Show full content
          </button>
        </div>

        <div v-else class="text-sm text-gray-600 italic">
          {{ message.content }}
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-gray-600">
      {{ conversation.messages.length }} message{{ conversation.messages.length !== 1 ? 's' : '' }} in conversation
    </div>

    <!-- Expanded Message Modal -->
    <div v-if="expandedMessageIndex !== null" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-96 mx-4 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-semibold">Full Message Content</h4>
          <button @click="expandedMessageIndex = null" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="whitespace-pre-wrap font-sans text-sm">
          {{ conversation?.messages[expandedMessageIndex]?.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CoverLetterConversation } from '~/types/conversation';

interface Props {
  conversation?: CoverLetterConversation;
  expanded?: boolean;
  collapsible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  collapsible: true,
});

// Local state
const isExpanded = ref(props.expanded);
const expandedMessageIndex = ref<number | null>(null);

// Computed properties
const canToggle = computed(() => props.collapsible && props.conversation && props.conversation.messages.length > 0);

// Methods
const getMessageClasses = (role: string) => {
  switch (role) {
    case 'user':
      return 'border-blue-300 bg-blue-50';
    case 'assistant':
      return 'border-green-300 bg-green-50';
    case 'system':
      return 'border-gray-300 bg-gray-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
};

const getRoleClasses = (role: string) => {
  switch (role) {
    case 'user':
      return 'text-blue-700';
    case 'assistant':
      return 'text-green-700';
    case 'system':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'user':
      return 'You';
    case 'assistant':
      return 'AI Assistant';
    case 'system':
      return 'System';
    default:
      return role;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const expandMessage = (index: number) => {
  expandedMessageIndex.value = index;
};
</script>

<style scoped>
.conversation-history {
  @apply bg-white rounded-lg border border-gray-200;
}

.message-item {
  @apply transition-all duration-200;
}

.message-item:hover {
  @apply shadow-sm;
}
</style>
