import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/app-shell";
import { DataTable, DataTableBody, DataTableHead, EmptyRow, Td, Th, Tr } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { enumParam, firstParam, pageParam } from "@/lib/params";
import { cn } from "@/lib/utils";
import { setUserStatusAction, updateSalaryAction } from "@/server/accounts/actions";
import { listUsers } from "@/server/accounts/queries";
import { ROLE_LABELS } from "@/server/auth/roles";
import { requireActor } from "@/server/auth/session";

import { CreateAdminForm, CreateTeacherForm } from "./account-forms";
import { SalaryForm } from "./salary-form";

export const metadata: Metadata = { title: "Tài khoản" };

const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;

/** US-05: danh sách tài khoản, lọc theo vai trò, tạo giảng viên / Admin, sửa hệ số lương, khoá / mở khoá. */
export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const actor = await requireActor("ADMIN");
  const params = await searchParams;
  const role = enumParam(params.role, ROLES);
  const q = firstParam(params.q)?.trim() ?? "";
  const { users, total, page, pageCount } = await listUsers(actor, { role, q, page: pageParam(params.page) });

  const filterHref = (value?: string) => {
    const search = new URLSearchParams();
    if (value) search.set("role", value);
    if (q) search.set("q", q);
    const query = search.toString();
    return query ? `/admin/users?${query}` : "/admin/users";
  };

  return (
    <>
      <PageHeader title="Tài khoản" description={`${total} tài khoản`} />

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <details className="rounded-lg border border-neutral-200 p-4" open={false}>
          <summary className="cursor-pointer font-medium">+ Tạo tài khoản giảng viên</summary>
          <div className="mt-4">
            <CreateTeacherForm />
          </div>
        </details>
        <details className="rounded-lg border border-neutral-200 p-4">
          <summary className="cursor-pointer font-medium">+ Tạo tài khoản Admin</summary>
          <div className="mt-4">
            <CreateAdminForm />
          </div>
        </details>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Lọc theo vai trò" className="flex flex-wrap gap-1">
          {[undefined, ...ROLES].map((value) => (
            <Link
              key={value ?? "all"}
              href={filterHref(value)}
              aria-current={role === value ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                role === value
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 hover:bg-neutral-100",
              )}
            >
              {value ? ROLE_LABELS[value] : "Tất cả vai trò"}
            </Link>
          ))}
        </nav>
        <form role="search" className="flex gap-2">
          {role ? <input type="hidden" name="role" value={role} /> : null}
          <label htmlFor="user-search" className="sr-only">
            Tìm theo tên hoặc email
          </label>
          <Input
            id="user-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Tên hoặc email…"
            className="w-52"
          />
          <Button type="submit" variant="outline">
            Tìm
          </Button>
        </form>
      </div>

      <DataTable aria-label="Danh sách tài khoản">
        <DataTableHead>
          <Th>Tên</Th>
          <Th>Email</Th>
          <Th>Vai trò</Th>
          <Th>Hệ số lương</Th>
          <Th>Trạng thái</Th>
          <Th>Ngày tạo</Th>
          <Th>
            <span className="sr-only">Thao tác</span>
          </Th>
        </DataTableHead>
        <DataTableBody>
          {users.length === 0 ? <EmptyRow colSpan={7}>Không có tài khoản nào.</EmptyRow> : null}
          {users.map((user) => (
            <Tr key={user.id} data-testid={`user-row-${user.email}`}>
              <Td label="Tên" className="font-medium">
                {user.name}
              </Td>
              <Td label="Email" className="max-md:break-all">
                {user.email}
              </Td>
              <Td label="Vai trò">{ROLE_LABELS[user.role]}</Td>
              <Td label="Hệ số lương">
                {user.salaryCoefficient !== null ? (
                  <SalaryForm
                    action={updateSalaryAction.bind(null, user.id)}
                    value={user.salaryCoefficient}
                    teacherName={user.name}
                  />
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </Td>
              <Td label="Trạng thái">
                <StatusBadge status={user.status} />
              </Td>
              <Td label="Ngày tạo">{formatDate(user.dateCreated)}</Td>
              <Td label="Thao tác">
                {user.id === actor.id ? (
                  <span className="text-xs text-neutral-500">Tài khoản của bạn</span>
                ) : user.status === "ACTIVE" ? (
                  <ActionForm
                    action={setUserStatusAction.bind(null, user.id, "LOCKED")}
                    confirmMessage={`Khoá tài khoản ${user.email}? Người này sẽ không đăng nhập được nữa.`}
                  >
                    <SubmitButton size="sm" variant="destructive">
                      Khoá
                    </SubmitButton>
                  </ActionForm>
                ) : (
                  <ActionForm action={setUserStatusAction.bind(null, user.id, "ACTIVE")}>
                    <SubmitButton size="sm" variant="outline">
                      Mở khoá
                    </SubmitButton>
                  </ActionForm>
                )}
              </Td>
            </Tr>
          ))}
        </DataTableBody>
      </DataTable>

      <div className="mt-6">
        <Pagination
          page={page}
          pageCount={pageCount}
          basePath="/admin/users"
          params={{ role, q: q || undefined }}
        />
      </div>
    </>
  );
}
