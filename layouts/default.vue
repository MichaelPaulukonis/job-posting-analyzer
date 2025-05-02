<template>
  <div>
    <header class="bg-blue-600 text-white p-4 shadow-md">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">Job Posting Analyzer</h1>
        <nav>
          <ul class="flex space-x-4">
            <li><NuxtLink to="/" class="hover:underline">Home</NuxtLink></li>
            <li><NuxtLink to="/analyze" class="hover:underline">Analyze</NuxtLink></li>
            <li><a href="/cover-letter/" class="hover:underline">Cover Letters</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer class="bg-gray-100 p-4 mt-8 border-t">
      <div class="container mx-auto text-center text-gray-600">
        <p>© {{ new Date().getFullYear() }} Job Posting Analyzer - Personal Tool</p>
      </div>
    </footer>
  </div>
</template>
