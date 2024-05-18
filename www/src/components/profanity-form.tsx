"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkProfanity } from "@/server";
import { useState, useTransition } from "react";

const ProfanityForm = () => {
  let [isPending, startTransition] = useTransition();
  const [profanityResponse, setProfanityResponse] = useState(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const formData = new FormData(event.currentTarget);
      const response = await checkProfanity(formData);
      setProfanityResponse(response);
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto bg-muted rounded-md border border-input p-5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md bg-primary p-2 text-primary-foreground text-sm py-1">
          POST
        </div>
        <div className="text-sm">
          https://profanity-api.bora-karaca.workers.dev
        </div>
        <div className="text-sm mx-auto">{"{message: string}"}</div>
      </div>
      <form
        action={checkProfanity}
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 w-full"
      >
        <div>
          <Label htmlFor="content">Content</Label>
          <Input type="text" id="content" name="content" />
        </div>
        <div>
          <Button disabled={isPending} type="submit" className="w-full">
            Check For Profanity
          </Button>
        </div>
      </form>
      <pre className="mt-4">{JSON.stringify(profanityResponse, null, 2)}</pre>
    </div>
  );
};
export default ProfanityForm;
