import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Home from "./Home.jsx";
import Login from "./Login.jsx";
import Team from "./Team.jsx";
import Admin from "./Admin.jsx";
import NewUser from "./NewUser.jsx";
import EditUser from "./EditUser.jsx";
import { PublicOnly, RequireAdmin, RequireAuth } from "./RouteGuards.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* من غير تسجيل دخول */}
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/newuser" element={<NewUser />} />
          <Route path="/admin/newuser" element={<NewUser />} />
          <Route path="/edit/:id" element={<EditUser />} />
          <Route path="/admin/edit/:id" element={<EditUser />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
