"use client";

import React, { useState } from "react";

import { cn } from "@/lib/utils";
import z from "zod";
import type { User } from "@prisma/client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewStoreFormProps {
  user: User;
}
const schema = z.object({
  storeName: z
    .string()
    .regex(/^[a-zA-Z0-9\s]+$/)
    .min(3)
    .max(255),
});

const resolver = zodResolver(schema);
const defaultValues = schema.parse({ storeName: "Your store" });

export const NewStoreForm = ({ user }: NewStoreFormProps) => {
  const form = useForm<z.infer<typeof schema>>({ resolver, defaultValues });
  const [storeExists, setStoreExists] = useState<boolean>(false);
  const [storeUrl, setStoreUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const newStoreUrl = data.storeName.toLowerCase().replace(/\s/g, "-");

    try {
      setLoading(true);

      const res = await fetch("/api/store/check-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeUrl: newStoreUrl }),
      });

      const checkStore = (await res.json()) as { storeExists: boolean };

      if (checkStore.storeExists) {
        setStoreExists(true);
        setLoading(false);
        return false;
      }

      setStoreExists(false);
    } catch (error) {
      toast("An error occurred while creating your store.", {
        description: "Please try again later or refresh the page.",
        position: "bottom-center",
      });

      setLoading(false);
    }
    // create a store and redirect
    try {
      setLoading(true);

      const newStore = await fetch("/api/store/create-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeName: data.storeName,
          storeUrl: newStoreUrl,
        }),
      });

      const storeData = await newStore.json();

      if (storeData.store) {
        toast(`Your store ${data.storeName} has been created!`, {
          description: "You will be redirected to your store shortly.",
          position: "bottom-center",
        });

         router.push(`/${storeData.store.storeUrl}`);
      }
    } catch (error) {
      toast("An error occurred while creating your store.", {
        description: "Please try again later or refresh the page.",
        position: "bottom-center",
      });

      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border border-neutral-200 rounded-lg w-[400px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="storeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoFocus
                    placeholder="ex: Fashion 247"
                    autoComplete="off"
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setStoreUrl(
                        e.target.value.toLowerCase().replace(/\s/g, "-")
                      );
                    }}
                    className={cn(
                      storeExists ||
                        (form.formState.errors.storeName &&
                          "border-red-600 focus-visible:ring-red-600")
                    )}
                  />
                </FormControl>
                <FormDescription>
                  {storeUrl &&
                    !storeExists &&
                    !form.formState.errors.storeName && (
                      <span>
                        Your store url will be{" "}
                        <span className="font-bold text-emerald-600">
                          {storeUrl}
                        </span>
                      </span>
                    )}
                  {!storeUrl &&
                    !storeExists &&
                    !form.formState.errors.storeName && (
                      <span>
                        This will be your store name and cannot be changed
                        later.
                      </span>
                    )}
                  {storeExists && !form.formState.errors.storeName && (
                    <span>
                      <span className="font-bold text-red-600">{storeUrl}</span>{" "}
                      is already taken. Please try another name.
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button variant={"default"} type="submit" className="mt-4">
            {!loading && "Create"}
            {loading && (
              <div className='flex items-center justify-center gap-x-2'>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Creating store...</span>
              </div>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};