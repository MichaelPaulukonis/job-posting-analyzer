# Plan: Display Application Version

This document outlines the plan to add a version number to the application and display it on the admin page.

## 1. Goal

The primary goals are:
1.  Set the application's version in `package.json`.
2.  Display this version number in the "Debug Information" section of the admin page.

## 2. Proposed Version

As requested, the initial version will be set to `0.4.0`.

## 3. Status

**Selected Option:** Option 1 (Nuxt Runtime Config)

## 4. Implementation Options

There are two recommended options for making the version number available to the frontend components.

### Option 1: Use Nuxt Runtime Config (Selected)

This approach uses Nuxt's built-in configuration system to expose the version number to the application.

**Pros:**
- **Idiomatic Nuxt:** This is the standard, recommended way to expose configuration and environment variables in Nuxt 3.
- **Type-Safe:** Nuxt generates types for the runtime config, providing autocompletion and type safety.
- **Globally Accessible:** The version is easily accessible in any component or composable via the `useRuntimeConfig` composable.

**Cons:**
- **Slight Overhead:** The version is included in the initial page payload sent to the client, which is a very minor overhead.

#### How to implement:

1.  **Modify `nuxt.config.ts`:**
    Read the `version` from `package.json` and add it to the `runtimeConfig.public`.

    ```typescript
    import { defineNuxtConfig } from 'nuxt/config';
    import { version } from './package.json';

    export default defineNuxtConfig({
      // ... other config
      runtimeConfig: {
        public: {
          appVersion: version,
        },
      },
    });
    ```

2.  **Update Admin Page (`pages/admin.vue`):**
    Access the version using `useRuntimeConfig` and add it to the `debugInfo` computed property.

    ```vue
    <script setup lang="ts">
    import { computed } from 'vue';
    // ...existing code...
    const config = useRuntimeConfig();

    // Debug information
    const debugInfo = computed(() => {
      return {
        appVersion: config.public.appVersion,
        storageFiles: storageFiles.value,
        // ...existing code...
      };
    });
    // ...existing code...
    </script>
    ```

### Option 2: Use Vite `define`

This approach uses the underlying Vite build tool to replace a global constant with the version number at build time.

**Pros:**
- **Zero Runtime Overhead:** The version number is directly injected into the code during the build process, so there is no runtime performance cost.
- **Simple:** It's a straightforward mechanism for injecting build-time data.

**Cons:**
- **Not Nuxt-specific:** This is a Vite feature, not a Nuxt one. While Nuxt uses Vite, relying on this directly can be less clear to developers familiar only with Nuxt conventions.
- **Global Constant:** It introduces a global variable, which can sometimes be less desirable than the structured access provided by `useRuntimeConfig`.
- **Requires Type Declaration:** You need to manually declare the type for the global constant to have TypeScript support.

#### How to implement:

1.  **Modify `nuxt.config.ts`:**
    Use the `vite.define` configuration to create a global constant.

    ```typescript
    import { defineNuxtConfig } from 'nuxt/config';
    import { version } from './package.json';

    export default defineNuxtConfig({
      // ... other config
      vite: {
        define: {
          '__APP_VERSION__': JSON.stringify(version),
        },
      },
    });
    ```

2.  **Create Type Declaration File (`types/global.d.ts`):**
    ```typescript
    declare const __APP_VERSION__: string;
    ```

3.  **Update Admin Page (`pages/admin.vue`):**
    Add the global constant to the `debugInfo` computed property.

    ```vue
    <script setup lang="ts">
    import { computed } from 'vue';
    // ...existing code...
    // Debug information
    const debugInfo = computed(() => {
      return {
        appVersion: __APP_VERSION__,
        storageFiles: storageFiles.value,
        // ...existing code...
      };
    });
    // ...existing code...
    </script>
    ```

## 5. Recommendation

**Option 1 (Nuxt Runtime Config)** is the recommended approach. It aligns best with Nuxt 3's design principles, offers better type safety out-of-the-box, and is the more maintainable and idiomatic solution for a Nuxt project.

Once you approve a plan, I can proceed with the implementation.
