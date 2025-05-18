import ImageInputForm from "@/components/client/ImageInputForm";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_auto_1fr] gap-8 p-20 w-full justify-center items-center h-screen bg-slate-50 overflow-clip">
      <h1 className="text-5xl text-center text-slate-900 w-full">User Interface Evaluation</h1>
      <p className="text-xl text-center text-slate-600 w-full">
        Let's review your interface to see how well it follows UI best practices
      </p>
      <ImageInputForm />
    </div>
  );
}
