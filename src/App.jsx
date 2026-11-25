import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Home from "./Home.jsx";
import Login from "./Login.jsx";
import Team from "./Team.jsx";
import About from "./About.jsx";
import Admin from "./Admin.jsx";
import NewUser from "./NewUser.jsx";
import EditUser from "./EditUser.jsx";
import { getApiToken, getTokenRoles } from "./api.js";

function AdminOnly({ children }) {
  if (!getApiToken()) return <Navigate to="/login" replace />;
  if (!getTokenRoles().includes("admin")) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/_dev/add-user" element={import.meta.env.DEV ? <NewUser /> : <Navigate to="/login" replace />} />
        <Route path="/team" element={<Team />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
        <Route path="/newuser" element={<AdminOnly><NewUser /></AdminOnly>} />
        <Route path="/admin/newuser" element={<AdminOnly><NewUser /></AdminOnly>} />
        <Route path="/edit/:id" element={<AdminOnly><EditUser /></AdminOnly>} />
        <Route path="/admin/edit/:id" element={<AdminOnly><EditUser /></AdminOnly>} />
      </Routes>
    </BrowserRouter>
  );
}
