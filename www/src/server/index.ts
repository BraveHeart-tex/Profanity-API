"use server";

export const checkProfanity = async (formData: FormData) => {
  try {
    const text = formData.get("content");
    const response = await fetch(
      "https://profanity-api.bora-karaca.workers.dev",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error };
  }
};
