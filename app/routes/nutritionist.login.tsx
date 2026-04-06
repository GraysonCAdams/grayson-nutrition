import { Form, useActionData, useLoaderData } from "react-router";
import { data, redirect } from "react-router";
import { isPasswordSet, setPassword, verifyPassword } from "~/lib/auth.server";
import { getNutritionistSession, commitSession, isNutritionistAuthenticated } from "~/lib/session.server";
import type { Route } from "./+types/nutritionist.login";

export async function loader({ request }: Route.LoaderArgs) {
  const isAuth = await isNutritionistAuthenticated(request);
  if (isAuth) {
    throw redirect("/nutritionist");
  }
  return { hasPassword: isPasswordSet() };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const password = String(formData.get("password"));
  const confirmPassword = formData.get("confirmPassword");

  if (!password || password.length < 4) {
    return data({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const hasPassword = isPasswordSet();

  if (!hasPassword) {
    // Setting password for first time
    if (password !== String(confirmPassword)) {
      return data({ error: "Passwords do not match" }, { status: 400 });
    }
    await setPassword(password);
  } else {
    // Verifying existing password
    const valid = await verifyPassword(password);
    if (!valid) {
      return data({ error: "Incorrect password" }, { status: 400 });
    }
  }

  const session = await getNutritionistSession(request);
  session.set("role", "nutritionist");
  return redirect("/nutritionist", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function NutritionistLogin() {
  const { hasPassword } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
          {hasPassword ? "Welcome back" : "Set up access"}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {hasPassword
            ? "Enter your password to continue"
            : "Create a password for the nutritionist view"}
        </p>

        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              placeholder="Enter password"
            />
          </div>

          {!hasPassword && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="Confirm password"
              />
            </div>
          )}

          {actionData?.error && (
            <p className="text-sm text-red-500 font-medium">{actionData.error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-sm"
          >
            {hasPassword ? "Sign in" : "Create password"}
          </button>
        </Form>
      </div>
    </div>
  );
}
