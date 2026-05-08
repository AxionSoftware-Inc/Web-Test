import { TestCrudForm } from "@/features/crud/ui/test-crud-form";
import { questApi } from "@/shared/api/questlab-api";

export default async function CrudPage() {
  const [subjects, topics] = await Promise.all([questApi.subjects(), questApi.topics()]);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <TestCrudForm subjects={subjects} topics={topics} />
      </div>
    </main>
  );
}
