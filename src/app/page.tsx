import { checkDatabase } from "@/lib/health";

// Trang phụ thuộc trạng thái CSDL nên luôn render theo từng request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const database = await checkDatabase();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <p className="text-sm font-medium text-neutral-500">Dự án CNPM</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">E-Learning</h1>
        <p className="mt-2 text-neutral-600">
          Ứng dụng học trực tuyến cho trung tâm đào tạo. Khung project đã sẵn sàng, các chức năng sẽ được thêm
          dần theo từng sprint.
        </p>
      </div>

      <section aria-labelledby="status-heading" className="rounded-lg border border-neutral-200 p-4">
        <h2 id="status-heading" className="text-sm font-semibold text-neutral-700">
          Trạng thái hệ thống
        </h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-neutral-500">Ứng dụng</dt>
          <dd data-testid="app-status" className="font-medium text-green-700">
            Đang chạy
          </dd>
          <dt className="text-neutral-500">Cơ sở dữ liệu</dt>
          {database.ok ? (
            <dd data-testid="db-status" className="font-medium text-green-700">
              Đã kết nối (PostgreSQL {database.version})
            </dd>
          ) : (
            <dd data-testid="db-status" className="font-medium text-red-700">
              Chưa kết nối được — hãy chạy <code>npm run db:up</code>
            </dd>
          )}
        </dl>
      </section>
    </main>
  );
}
