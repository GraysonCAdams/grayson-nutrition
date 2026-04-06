import { Link, useLocation } from "react-router";

export function TabNav() {
  const location = useLocation();
  const isClient = location.pathname.startsWith("/client");
  const isNutritionist = location.pathname.startsWith("/nutritionist");

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mx-auto">
      <Link
        to="/client"
        className={`
          px-5 py-2 rounded-lg text-sm font-bold transition-all
          ${isClient
            ? "bg-white text-indigo-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
          }
        `}
      >
        Client
      </Link>
      <Link
        to="/nutritionist"
        className={`
          px-5 py-2 rounded-lg text-sm font-bold transition-all
          ${isNutritionist
            ? "bg-white text-indigo-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
          }
        `}
      >
        Nutritionist
      </Link>
    </div>
  );
}
