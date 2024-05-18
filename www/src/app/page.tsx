import ProfanityForm from "@/components/profanity-form";

export default function Home() {
  return (
    <main className="h-screen flex flex-col gap-4 items-center justify-center p-2">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl font-mono text-destructive">
        Profanity Checker
      </h1>
      <p className="text-muted-foreground">
        Check if your text contains a{" "}
        <span className="bg-red-500 text-white font-scary px-2 rounded-md">
          f@#k!ng
        </span>{" "}
        swear word!
      </p>
      <ProfanityForm />
    </main>
  );
}
