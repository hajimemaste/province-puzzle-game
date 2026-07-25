import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/admin/old-provinces", label: "Tỉnh cũ" },
  { to: "/admin/new-provinces", label: "Tỉnh mới" },
  { to: "/admin/puzzle-image", label: "Ảnh ghép" },
  { to: "/admin/live", label: "Theo dõi trực tiếp" },
  { to: "/admin/leaderboard", label: "Bảng xếp hạng" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="font-bold text-slate-800 text-sm sm:text-base">Quản trị Game Ghép Tỉnh Thành</h1>
        <nav className="flex gap-3 sm:gap-4 text-sm overflow-x-auto whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:whitespace-normal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 ${isActive ? "text-emerald-600 font-semibold" : "text-slate-500 hover:text-slate-800"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="shrink-0 text-slate-500 hover:text-red-600">
            Đăng xuất
          </button>
        </nav>
      </header>
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
