import { Form, useActionData } from "react-router";
import { data, redirect } from "react-router";
import { verifyPassword, setPassword } from "~/lib/auth.server";
import { isNutritionistAuthenticated } from "~/lib/session.server";
import type { Route } from "./+types/nutritionist.settings";

export async function loader({ request }: Route.LoaderArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  if (!isAuth) {
    throw redirect("/nutritionist/login");
  }
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  if (!isAuth) {
    throw redirect("/nutritionist/login");
  }

  const formData = await request.formData();
  const currentPassword = String(formData.get("currentPassword"));
  const newPassword = String(formData.get("newPassword"));
  const confirmPassword = String(formData.get("confirmPassword"));

  const valid = await verifyPassword(currentPassword);
  if (!valid) {
    return data({ error: "Current password is incorrect", success: false }, { status: 400 });
  }

  if (newPassword.length < 4) {
    return data({ error: "New password must be at least 4 characters", success: false }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return data({ error: "New passwords do not match", success: false }, { status: 400 });
  }

  await setPassword(newPassword);
  return data({ success: true, error: null });
}

export default function NutritionistSettings() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-gray-800 text-center mb-6">
          Change Password
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          {actionData?.error && (
            <p className="text-sm text-red-500 font-medium">{actionData.error}</p>
          )}
          {actionData?.success && (
            <p className="text-sm text-emerald-600 font-medium">Password updated successfully!</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-sm"
          >
            Update Password
          </button>
        </Form>

        <a
          href="/nutritionist"
          className="block text-center text-sm text-gray-500 hover:text-indigo-600 mt-4"
        >
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}
