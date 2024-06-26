"use client";

import * as React from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Editor } from "@tinymce/tinymce-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import { Variants } from "@/components/Products/ProductVariants";
import { toast } from "sonner";
import { FileUpload } from "@/components/Upload/FileUpload";
import {
  type Category,
  type Product,
  type Variant as VariantType,
  type Image as ImageType,
} from "@prisma/client";
import { CategoriesDropdown } from "./CategoriesDropdown";
import { Variant, generateVariants } from "@/lib/products";
import { FaMinus } from "react-icons/fa";
import { VariantsInventory } from "./VariantsInventory";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const ProductFormSchema = z.object({
  title: z.string().min(10).max(255),
  description: z.string().min(50).max(200000),
  categoryId: z.string().refine(
    (value) => {
      return value !== "";
    },
    { message: "Please select a category." }
  ),
  status: z.boolean(),
  price: z.number().min(0),
  inventory: z.number().min(0),
  compareAtPrice: z.number().min(0),
  costPerItem: z.number().min(0),
  alwaysAvailable: z.boolean().default(false).optional(),
});

type ProductProps = Product & {
  variants: VariantType[];
  images: ImageType[];
};

interface ProductFormProps {
  categories: Category[];
  userId: string;
  storeId: number;
  product?: ProductProps | null;
}

export const ProductForm = ({
  categories,
  userId,
  storeId,
  product,
}: ProductFormProps) => {
  const transformCategories = categories.map((category) => {
    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
    };
  });

  const [files, setFiles] = React.useState<
    {
      imageId?: string;
      imageUrl: string;
    }[]
  >([]);
  const [variants, setVariants] = React.useState<Variants>();
  const [variantsInventory, setVariantsInventory] =
    React.useState<Record<string, string[]>>();
  const [saving, setSaving] = React.useState<boolean>(false);
  const [deletedFiles, setDeletedFiles] = React.useState<string[]>([]);
  const router = useRouter();
  const path = usePathname();
  const { theme } = useTheme();

  const deleteFile = async (imageUrl: string) => {
    const newFiles = files.filter((file) => file.imageUrl !== imageUrl);
    setFiles(newFiles);
    try {
      const response = await fetch("/api/products/deleteImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (response.ok) {
        toast("Image has been deleted!");
      }
    } catch (error) {
      toast("An error occurred while deleting the image.");
    }
  };

  React.useEffect(() => {
    const extractVariants = (existingVariants: VariantType[]) => {
      const variantsData = {
        sizes: new Set<string>(),
        colors: new Set<string>(),
        materials: new Set<string>(),
      };

      existingVariants.forEach((variant) => {
        if (variant.size) {
          variantsData.sizes.add(variant.size);
        }

        if (variant.color) {
          variantsData.colors.add(variant.color);
        }

        if (variant.material) {
          variantsData.materials.add(variant.material);
        }
      });

      setVariants({
        sizes: Array.from(variantsData.sizes).map((size) => ({
          id: size,
          value: size,
        })),
        colors: Array.from(variantsData.colors).map((color) => ({
          id: color,
          value: color,
        })),
        materials: Array.from(variantsData.materials).map((material) => ({
          id: material,
          value: material,
        })),
      });
    };

    if (product) {
      console.log(product);
      extractVariants(product?.variants || []);
      setFiles(
        product.images.map((image) => {
          return {
            imageUrl: image.imageUrl,
          };
        }) || []
      );
    }
  }, [product?.variants, setVariants, product]);

  const form = useForm({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      categoryId: product?.categoryId.toString() || "",
      status: product?.status === "ACTIVE" ? true : false,
      price: product?.price || 0,
      inventory: product?.inventory || 0,
      compareAtPrice: product?.compareAtPrice || 0,
      costPerItem: product?.costPerProduct || 0,
      alwaysAvailable: product?.allowPurchaseOutOfStock || false,
    },
  });

  const onSubmit = async (values: z.infer<typeof ProductFormSchema>) => {
    const data = {
      title: values.title,
      description: values.description,
      categoryId: Number(values.categoryId),
      status: values.status ? "ACTIVE" : "INACTIVE",
      price: values.price,
      inventory: values.inventory,
      costPerProduct: values.costPerItem,
      compareAtPrice: values.compareAtPrice,
      allowPurchaseOutOfStock: values.alwaysAvailable || false,
      userId: userId,
      storeId: storeId,
    };

    try {
      setSaving(true);
      const newProduct = await fetch("/api/products", {
        method: product ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          variants: variantsInventory,
          images: files,
          productId: product?.productId,
        }),
      });

      if (newProduct.status === 200) {
        toast(`Product ${values.title} has been saved!`, {
          description: "You can now view the product in the product list.",
          position: "bottom-right",
          action: {
            label: "View product",
            onClick: () => {
              console.log("View product clicked");
            },
          },
        });

        router.push("/" + path.split("/")[1] + "/products");
      }
    } catch (error) {
      toast(`An error occurred while saving the product.`, {
        description: "Please try again.",
        position: "bottom-right",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* BEGIN: PAGE TITLE */}
      <div className="grid grid-cols-6 gap-x-4">
        <div className="col-span-4">
          <h1 className="font-bold mb-4">
            {product ? "Update" : "Add"} Product
          </h1>
        </div>
        <div className="col-span-2 flex items-center gap-x-2 justify-end">
          <Button
            disabled={saving}
            variant={"default"}
            onClick={form.handleSubmit(onSubmit)}
          >
            {saving ? (
              <div className="flex items-center justify-center gap-x-2">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black"
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
                <span>Saving Product</span>
              </div>
            ) : (
              <span>Save</span>
            )}
          </Button>
        </div>
      </div>
      {/* END: PAGE TITLE */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mt-4 grid grid-cols-6 gap-x-8">
            {/* BEGIN: LEFT SIDE */}
            <div className="col-span-4">
              <div>
                <div className="">
                  <FormItem>
                    <FormLabel htmlFor="title">Title</FormLabel>
                    <FormControl>
                      <Input
                        id="title"
                        placeholder="Enter the title of the product"
                        {...form.register("title")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.title?.message}
                    </FormMessage>
                  </FormItem>

                  <FormItem className="mt-6">
                    <FormLabel htmlFor="description">Description</FormLabel>
                    <FormDescription>
                      Describe the product in details. This will be displayed on
                      the product page. You can use markdown to format the text.
                    </FormDescription>
                    <FormControl>
                      <Editor
                        id="description"
                        apiKey="y4kcgqvxks2fksxeqt33hjv8b7evrvwjatpgz1d5ksyjcvf5"
                        initialValue={form.getValues("description")}
                        onEditorChange={(content, editor) => {
                          form.setValue("description", content);
                          console.log(content);
                        }}
                        init={{
                          height: 300,
                          menubar: true,
                          plugins: [
                            "autoresize",
                            "advlist",
                            "autolink",
                            "lists",
                            "link",
                            "image",
                            "charmap",
                            "anchor",
                            "searchreplace",
                            "visualblocks",
                            "code",
                            "fullscreen",
                            "insertdatetime",
                            "media",
                            "table",
                            "preview",
                            "wordcount",
                          ],
                          toolbar:
                            "undo redo | blocks | " +
                            "bold italic forecolor | alignleft aligncenter " +
                            "alignright alignjustify | bullist numlist outdent indent | " +
                            "removeforma",
                          content_style:
                            "body { font-family:Helvetica,Arial,sans-serif; font-size:16px }",
                          skin: theme === "dark" ? "oxide-dark" : "oxide",
                          content_css: theme === "dark" ? "dark" : "default",
                        }}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.description?.message}
                    </FormMessage>
                  </FormItem>

                  <div className="mt-12">
                    <div className="mb-4">
                      {files.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {files.map((file) => (
                            <div
                              key={file.imageUrl}
                              className="relative h-[150px] border rounded group"
                            >
                              <Button
                                onClick={() => {
                                  deleteFile(file.imageUrl);
                                }}
                                variant={"ghost"}
                                size={"icon"}
                                className="z-10 hidden group-hover:flex absolute top-3 right-3 rounded-full h-4 w-4 bg-white items-center justify-center border cursor-pointer"
                              >
                                <FaMinus size={12} />
                              </Button>
                              <Image
                                src={"https://utfs.io/f/" + file.imageUrl}
                                alt="product image"
                                fill
                                className="object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <FileUpload
                      endpoint={"productImage"}
                      onFileUploadComplete={(res) => {
                        const newFiles = res.map((file: { key: string }) => {
                          return {
                            imageUrl: file.key,
                          };
                        });

                        setFiles((prev) => [...prev, ...newFiles]);
                      }}
                    />
                  </div>
                </div>

                <div
                  aria-label="product price"
                  className="space-y-4 mt-6 bg-[--card-background] rounded-xl py-4"
                >
                  <h3 className="font-semibold text-sm">Pricing and compare</h3>

                  <div className="flex items-center gap-x-2">
                    <FormItem className="flex-1">
                      <FormLabel htmlFor="price">Price</FormLabel>
                      <FormControl>
                        <Input
                          id="price"
                          type="text"
                          placeholder="Enter the price of the product"
                          className="w-full"
                          {...form.register("price", {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.price?.message}
                      </FormMessage>
                    </FormItem>

                    <FormItem className="flex-1">
                      <FormLabel htmlFor="compareAtPrice">
                        Compare at price
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="compareAtPrice"
                          type="text"
                          placeholder="Enter the compare at price of the product"
                          className="w-full"
                          {...form.register("compareAtPrice", {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.compareAtPrice?.message}
                      </FormMessage>
                    </FormItem>
                  </div>

                  <div>
                    <FormItem>
                      <FormLabel htmlFor="costPerItem">
                        Cost per product
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="costPerItem"
                          type="text"
                          placeholder="Cost per product item"
                          className="w-full"
                          {...form.register("costPerItem", {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.costPerItem?.message}
                      </FormMessage>
                    </FormItem>
                  </div>
                </div>

                <div
                  aria-label="product price"
                  className="space-y-2 mt-6 bg-[--card-background] rounded-xl"
                >
                  <h3 className="font-semibold text-sm">Variants</h3>
                  <FormItem>
                    <Variants
                      handleData={(variants) => {
                        setVariants(variants);
                      }}
                      existingVariants={variants}
                    />
                  </FormItem>

                  {variants && (
                    <VariantsInventory
                      variants={variants}
                      updateVariants={setVariantsInventory}
                    />
                  )}
                </div>

                <div
                  aria-label="product price"
                  className="space-y-2 mt-6 bg-[--card-background] rounded-xl"
                >
                  <h3 className="font-semibold text-sm">Availability</h3>

                  <div className="flex items-top space-x-2 py-3">
                    <FormField
                      control={form.control}
                      name="alwaysAvailable"
                      render={({ field }) => (
                        <FormItem className="flex items-top gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              id="alwaysAvailable"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>

                          <div className="space-y-2 leading-none">
                            <label
                              htmlFor="alwaysAvailable"
                              className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Continue selling when out of stock
                            </label>
                            <p className="text-muted-foreground text-sm">
                              If this is unchecked, the product will be
                              unavailable for purchase when the inventory
                              reaches 0.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button
                disabled={saving}
                variant={"default"}
                type={"submit"}
                className="my-6"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-x-2">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-black"
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
                    <span>Saving product</span>
                  </div>
                ) : (
                  <span>Save</span>
                )}
              </Button>
            </div>
            {/* END: LEFT SIDE */}

            {/* BEGIN: RIGHT SIDE */}
            <div className="col-span-2">
              <div className="border rounded-xl p-4">
                <FormItem className="flex items-center justify-between">
                  <FormLabel htmlFor="status">Status</FormLabel>
                  <FormControl>
                    <Switch
                      id="status"
                      {...form.register("status")}
                      onCheckedChange={(checked) => {
                        form.setValue("status", checked);
                      }}
                    />
                  </FormControl>
                </FormItem>

                <FormItem className="mt-6">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoriesDropdown
                      categories={transformCategories}
                      onSelect={(categoryId) => {
                        form.setValue("categoryId", categoryId.toString());
                      }}
                      activeCategoryId={form.getValues("categoryId")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.categoryId?.message}
                  </FormMessage>
                </FormItem>
              </div>

              <div className="p-4 mt-6 border rounded-xl">
                <FormItem>
                  <FormLabel htmlFor="inventory">Inventory</FormLabel>
                  <FormDescription>
                    It&apos;s the default inventory for the product. You can
                    also set inventory for each variant.
                  </FormDescription>
                  <FormControl>
                    <Input
                      id="inventory"
                      type="number"
                      placeholder="Product inventory"
                      {...form.register("inventory", {
                        valueAsNumber: true,
                      })}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.inventory?.message}
                  </FormMessage>
                </FormItem>
              </div>
            </div>
            {/* END: RIGHT SIDE */}
          </div>
        </form>
      </Form>
    </>
  );
};
