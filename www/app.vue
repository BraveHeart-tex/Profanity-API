<template>
  <div class="h-screen bg-gray-200 flex justify-center items-center flex-col">
    <h1 class="font-extrabold text-green-600 text-5xl mb-10">Profanity API Demo</h1>
    <form @submit.prevent="submitForm" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label for="content">Content To Check</label>
        <InputText id="content" v-model="formData.content" aria-describedby="username-help" required />
        <small id="username-help">Enter the content you want to check for profanity</small>
      </div>
      <Button icon="pi pi-search" label="Check For Profanity" type="submit" class="w-full lg:w-max" />
    </form>

    <div v-if="profanityResult" class="mt-4">
      <pre>{{ JSON.stringify(profanityResult) }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        content: ""
      },
      profanityResult: ""
    };
  },
  methods: {
    async submitForm() {
      const { content } = this.formData;
      const body = JSON.stringify({ message: content });
      if (!content) return;
      const response = await fetch("https://profanity-api.bora-karaca.workers.dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
      const result = await response.json();
      this.profanityResult = result;
    }
  }
};
</script>