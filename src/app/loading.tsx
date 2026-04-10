import LoaderBrand from "@/components/LoaderBrand";

export default function GlobalLoading() {
  return (
    <div className="bg-[#050806] text-white">
      <div className="mx-auto flex min-h-[38vh] max-w-6xl items-center justify-center px-6 py-16">
        <LoaderBrand />
      </div>
    </div>
  );
}
