# Admin: Version Display

## Overview

The application version, as defined in `package.json`, is displayed on the admin page to provide a clear reference for the currently deployed build.

## Location

The version number is located within the **Debug Information** section on the `/admin` page.

## Implementation

The version is retrieved from `package.json` and exposed to the application via Nuxt's runtime configuration. The `pages/admin.vue` component then accesses this configuration and includes it in the `debugInfo` computed property, which is rendered in the template.
