"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  LoaderCircle,
  RotateCcw,
  Search,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";
import {
  AdminEmptyState,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminTableFrame,
  adminTableClassName,
  adminTableHeadClassName,
} from "./admin-ui";

type UserRole = "Customer" | "Owner" | "Admin";
type AccountStatus = "active" | "suspended" | "deleted";
type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string | null;
};
type UserState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: AdminUser[]; total: number };

const pageSize = 50;

function isAdminUser(value: unknown): value is AdminUser {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "role" in value &&
    (value.role === "Customer" ||
      value.role === "Owner" ||
      value.role === "Admin") &&
    "accountStatus" in value &&
    (value.accountStatus === "active" ||
      value.accountStatus === "suspended" ||
      value.accountStatus === "deleted") &&
    "createdAt" in value &&
    (typeof value.createdAt === "string" || value.createdAt === null)
  );
}

function parseUsers(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("items" in payload) ||
    !Array.isArray(payload.items) ||
    !payload.items.every(isAdminUser) ||
    !("total" in payload) ||
    typeof payload.total !== "number" ||
    !Number.isInteger(payload.total) ||
    payload.total < 0
  ) {
    return null;
  }
  return { items: payload.items, total: payload.total };
}

function formatRegistrationDate(value: string | null) {
  if (!value) {
    return "Unavailable";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

const roleClassNames: Record<UserRole, string> = {
  Customer: "bg-sky-50 text-sky-800",
  Owner: "bg-emerald-50 text-emerald-800",
  Admin: "bg-violet-50 text-violet-800",
};

const accountStatusClassNames: Record<AccountStatus, string> = {
  active: "bg-emerald-50 text-emerald-800",
  suspended: "bg-amber-50 text-amber-800",
  deleted: "bg-rose-50 text-rose-800",
};

export default function AdminUsersClient() {
  const { accessToken, user } = useDashboard();
  const [state, setState] = useState<UserState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const query = useMemo(() => {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (roleFilter) {
      params.set("role", roleFilter);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    return params.toString();
  }, [offset, roleFilter, search, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      async function loadUsers() {
        setState({ status: "loading" });
        setError(null);
        try {
          const payload = await dashboardRequest(
            `/api/admin/users?${query}`,
            accessToken,
            { signal: controller.signal },
          );
          const result = parseUsers(payload);
          if (!result) {
            throw new Error("The user service returned invalid user data.");
          }
          if (!controller.signal.aborted) {
            setState({ status: "success", ...result });
          }
        } catch (loadError) {
          if (!controller.signal.aborted) {
            setState({
              status: "error",
              message:
                loadError instanceof Error
                  ? loadError.message
                  : "Could not load registered users.",
            });
          }
        }
      }
      void loadUsers();
    }, search.trim() ? 200 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [accessToken, query, retryKey, search]);

  async function saveRole(target: AdminUser) {
    const role = draftRoles[target.id] ?? target.role;
    if (role === target.role || target.accountStatus !== "active") {
      return;
    }
    setSavingId(target.id);
    setError(null);
    setSavedMessage(null);
    try {
      const payload = await dashboardRequest(
        `/api/admin/users/${encodeURIComponent(target.id)}/role`,
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        },
      );
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("item" in payload) ||
        !isAdminUser(payload.item)
      ) {
        throw new Error("The user service returned invalid updated user data.");
      }
      const updated = payload.item;
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : current,
      );
      setDraftRoles((current) => {
        const next = { ...current };
        delete next[target.id];
        return next;
      });
      setSavedMessage(`Role updated for ${updated.name || updated.email}.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not change this user's role.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function updateAccountStatus(
    target: AdminUser,
    accountStatus: AccountStatus,
  ) {
    if (
      accountStatus === target.accountStatus ||
      statusSavingId !== null ||
      savingId === target.id
    ) {
      return;
    }

    const identity = target.name || target.email;
    const confirmation =
      accountStatus === "deleted"
        ? `Delete ${identity}? This is reversible; their account data, equipment, and rental history will be kept for Admin restore.`
        : accountStatus === "suspended"
          ? `Suspend ${identity}? They will be signed out and blocked from signing in until restored.`
          : `Restore ${identity}? They will be able to sign in again.`;
    if (!window.confirm(confirmation)) {
      return;
    }

    setStatusSavingId(target.id);
    setError(null);
    setSavedMessage(null);
    try {
      const payload = await dashboardRequest(
        `/api/admin/users/${encodeURIComponent(target.id)}/status`,
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify({ accountStatus }),
        },
      );
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("item" in payload) ||
        !isAdminUser(payload.item)
      ) {
        throw new Error("The user service returned invalid updated user data.");
      }

      const updated = payload.item;
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : current,
      );
      setSavedMessage(
        accountStatus === "deleted"
          ? `Account deleted for ${identity}. Its data is retained for restore.`
          : accountStatus === "suspended"
            ? `Account suspended for ${identity}.`
            : `Account restored for ${identity}.`,
      );
      setRetryKey((current) => current + 1);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not update this account's status.",
      );
    } finally {
      setStatusSavingId(null);
    }
  }

  const pageNumber = Math.floor(offset / pageSize) + 1;
  const pageCount =
    state.status === "success"
      ? Math.max(1, Math.ceil(state.total / pageSize))
      : 1;

  return (
    <div>
      <AdminPageHeader
        description="Manage roles, suspend access, and reversibly delete accounts while keeping their data for restore. You cannot change your own account or suspend the last active Admin."
        eyebrow="Account management"
        title="All Users"
      />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">Search user name or email</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-11 w-full rounded-xl border border-[#dde2ef] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#526ab7] focus:ring-4 focus:ring-[#526ab7]/10"
            onChange={(event) => {
              setOffset(0);
              setSearch(event.target.value);
            }}
            placeholder="Search name or email"
            type="search"
            value={search}
          />
        </label>
        <label>
          <span className="sr-only">Filter users by role</span>
          <select
            className="h-11 rounded-xl border border-[#dde2ef] bg-white px-3 text-sm outline-none focus:border-[#526ab7] focus:ring-4 focus:ring-[#526ab7]/10"
            onChange={(event) => {
              setOffset(0);
              setRoleFilter(event.target.value);
            }}
            value={roleFilter}
          >
            <option value="">All roles</option>
            <option value="Customer">Customer</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter users by account status</span>
          <select
            className="h-11 rounded-xl border border-[#dde2ef] bg-white px-3 text-sm outline-none focus:border-[#526ab7] focus:ring-4 focus:ring-[#526ab7]/10"
            onChange={(event) => {
              setOffset(0);
              setStatusFilter(event.target.value);
            }}
            value={statusFilter}
          >
            <option value="all">All account statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </label>
        {state.status === "success" && (
          <p className="ml-auto text-xs font-bold text-slate-500">
            {state.total} registered user{state.total === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {error && (
        <p
          aria-live="assertive"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900"
          role="alert"
        >
          {error}
        </p>
      )}
      {savedMessage && (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          role="status"
        >
          {savedMessage}
        </p>
      )}
      {state.status === "loading" && (
        <AdminLoading message="Loading registered users..." />
      )}
      {state.status === "error" && (
        <AdminError
          message={state.message}
          onRetry={() => setRetryKey((current) => current + 1)}
        />
      )}
      {state.status === "success" && state.items.length === 0 && (
        <AdminEmptyState
          description="Try a different search or role filter."
          title="No users found"
        />
      )}
      {state.status === "success" && state.items.length > 0 && (
        <>
          <AdminTableFrame>
            <table className={adminTableClassName}>
              <thead className={adminTableHeadClassName}>
                <tr>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Registration date</th>
                  <th className="px-4 py-4">Account status</th>
                  <th className="px-4 py-4">Manage role</th>
                  <th className="px-4 py-4">Account actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.items.map((account) => {
                  const selectedRole = draftRoles[account.id] ?? account.role;
                  const isSelf = account.id === user.id;
                  return (
                    <tr className="align-middle" key={account.id}>
                      <td className="px-4 py-4 text-sm font-extrabold text-[#17213d]">
                        {account.name || "Name unavailable"}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-bold text-slate-400">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-600">
                        {account.email || "Email unavailable"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold ${roleClassNames[account.role]}`}
                        >
                          {account.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                        {formatRegistrationDate(account.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold capitalize ${accountStatusClassNames[account.accountStatus]}`}
                        >
                          {account.accountStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <label>
                            <span className="sr-only">
                              New role for {account.name || account.email}
                            </span>
                            <select
                              className="h-9 rounded-lg border border-[#dde2ef] bg-white px-2 text-xs font-semibold text-[#17213d] outline-none focus:border-[#526ab7] focus:ring-2 focus:ring-[#526ab7]/15 disabled:opacity-50"
                              disabled={
                                isSelf ||
                                savingId === account.id ||
                                statusSavingId === account.id ||
                                account.accountStatus !== "active"
                              }
                              onChange={(event) => {
                                const value = event.target.value;
                                if (
                                  value === "Customer" ||
                                  value === "Owner" ||
                                  value === "Admin"
                                ) {
                                  setDraftRoles((current) => ({
                                    ...current,
                                    [account.id]: value,
                                  }));
                                }
                              }}
                              value={selectedRole}
                            >
                              <option value="Customer">Customer</option>
                              <option value="Owner">Owner</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </label>
                          <button
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#17213d] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#263866] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={
                              isSelf ||
                              savingId === account.id ||
                              statusSavingId === account.id ||
                              account.accountStatus !== "active" ||
                              selectedRole === account.role
                            }
                            onClick={() => void saveRole(account)}
                            type="button"
                          >
                            {savingId === account.id ? (
                              <LoaderCircle
                                aria-hidden="true"
                                className="size-3.5 animate-spin"
                              />
                            ) : (
                              <UserRoundCog
                                aria-hidden="true"
                                className="size-3.5"
                              />
                            )}
                            Save
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {account.accountStatus === "active" ? (
                            <button
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 text-[11px] font-extrabold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                isSelf ||
                                statusSavingId === account.id ||
                                savingId === account.id
                              }
                              onClick={() =>
                                void updateAccountStatus(account, "suspended")
                              }
                              type="button"
                            >
                              {statusSavingId === account.id ? (
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="size-3.5 animate-spin"
                                />
                              ) : (
                                <Ban aria-hidden="true" className="size-3.5" />
                              )}
                              Suspend
                            </button>
                          ) : (
                            <button
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-[11px] font-extrabold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                isSelf ||
                                statusSavingId === account.id ||
                                savingId === account.id
                              }
                              onClick={() =>
                                void updateAccountStatus(account, "active")
                              }
                              type="button"
                            >
                              {statusSavingId === account.id ? (
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="size-3.5 animate-spin"
                                />
                              ) : (
                                <RotateCcw
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              )}
                              {account.accountStatus === "suspended"
                                ? "Reactivate"
                                : "Restore"}
                            </button>
                          )}
                          {account.accountStatus !== "deleted" && (
                            <button
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-100 px-2.5 text-[11px] font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                isSelf ||
                                statusSavingId === account.id ||
                                savingId === account.id
                              }
                              onClick={() =>
                                void updateAccountStatus(account, "deleted")
                              }
                              type="button"
                            >
                              <Trash2
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTableFrame>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
              Page {pageNumber} of {pageCount}
            </p>
            <div className="flex gap-2">
              <button
                className="min-h-9 rounded-lg border border-[#dde2ef] bg-white px-3 text-xs font-extrabold text-[#344675] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={offset === 0}
                onClick={() => setOffset((current) => Math.max(0, current - pageSize))}
                type="button"
              >
                Previous
              </button>
              <button
                className="min-h-9 rounded-lg border border-[#dde2ef] bg-white px-3 text-xs font-extrabold text-[#344675] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={offset + pageSize >= state.total}
                onClick={() => setOffset((current) => current + pageSize)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
