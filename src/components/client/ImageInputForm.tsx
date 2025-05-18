"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { UploadCloud, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ImageInputForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // central file handler
  const handleFile = useCallback((files: FileList | null) => {
    if (files?.length) {
      setFile(files[0]);
      console.log("File selected:", files[0]);
    }
  }, []);

  // input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files);
    },
    [handleFile]
  );

  // drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files);
    },
    [handleFile]
  );

  const handleFetch = async (formData: FormData) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  };

  // form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) {
        console.warn("No file to submit");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const data = await toast.promise(handleFetch(formData), {
          loading: "Uploading...",
          success: (data) => {
            console.log("File uploaded successfully:", data);
            return "File uploaded successfully";
          },
          error: (err) => {
            console.error("Error uploading file:", err);
            return "Error uploading file";
          },
        });

        await localStorage.setItem("result", JSON.stringify(await data.unwrap()));

        router.push("/result");
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    },
    [file]
  );

  const imageUrl = useMemo(() => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    return url;
  }, [file]);

  return (
    <form
      onSubmit={handleSubmit}
      className="h-full w-full flex flex-col justify-center items-center"
    >
      <label
        htmlFor="image-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "h-full relative min-w-[60rem] flex flex-col justify-center items-center cursor-pointer rounded-lg border-dashed border-[#CBD5E1] border-3 w-full gap-4",
          isDragging ? "bg-slate-100" : "bg-transparent"
        )}
      >
        {imageUrl && (
          <button
            className="absolute top-2 right-2 z-50"
            onClick={(e) => {
              e.preventDefault();
              setFile(null);
            }}
          >
            <XCircle color="red" size={45} />
          </button>
        )}
        <div className="flex flex-col justify-center items-center h-full w-full gap-4">
          {imageUrl && (
            <>
              <div className="relative h-[27rem]">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  className="w-auto h-full object-cover rounded-lg mb-4"
                  objectFit="cover"
                  height={500}
                  width={500}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <Button
                size={"lg"}
                type="submit"
                className="bg-blue-900 text-white text-xl hover:bg-blue-950 duration-200 ease-in-out py-6"
              >
                Go evaluate
              </Button>
            </>
          )}
          {!imageUrl && (
            <>
              <div className="flex flex-col justify-center items-center h-[27rem] w-full">
                <UploadCloud size={100} color="#CBD5E1" />
                <p className=" text-slate-600">
                  Support all image formats up to 5MB
                </p>
                <p className="text-slate-600">
                  Drag & drop, or click to select
                </p>
              </div>
              <Button
                size={"lg"}
                onClick={() => inputRef.current?.click()}
                type="button"
                className="bg-blue-900 text-white text-xl hover:bg-blue-950 duration-200 ease-in-out py-6"
              >
                Image upload
              </Button>
            </>
          )}
        </div>
      </label>
      <input
        ref={inputRef}
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={handleChange}
        hidden
      />
    </form>
  );
}
