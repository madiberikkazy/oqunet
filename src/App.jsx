import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";

import Register from "./pages/auth/Register.jsx";
import Login from "./pages/auth/Login.jsx";

import Home from "./pages/user/Home.jsx";
import Books from "./pages/user/Books.jsx";
import BookDetail from "./pages/user/BookDetail.jsx";
import RequestBook from "./pages/user/RequestBook.jsx";
import Notification from "./pages/user/Notification.jsx";
import Profile from "./pages/user/Profile.jsx";
import Settings from "./pages/user/Settings.jsx";

import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminBooks from "./pages/admin/AdminBooks.jsx";
import AddBook from "./pages/admin/AddBook.jsx";
import AdminNotification from "./pages/admin/AdminNotification.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";

import CreateCommunity from "./pages/community/CreateCommunity.jsx";
import JoinCommunity from "./pages/community/JoinCommunity.jsx";
import CommunityProfile from "./pages/community/CommunityProfile.jsx";
import UserProfile from "./pages/community/UserProfile.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

function RoleRoute({ userElement, adminElement }) {
  const { user } = useAuth();
  return user?.role === "admin" ? adminElement : userElement;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleRoute userElement={<Home />} adminElement={<AdminHome />} />} />
        <Route path="/books" element={<RoleRoute userElement={<Books />} adminElement={<AdminBooks />} />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/books/:id/request" element={<RequestBook />} />
        <Route path="/books/add" element={<AddBook />} />

        <Route path="/notifications" element={<RoleRoute userElement={<Notification />} adminElement={<AdminNotification />} />} />
        <Route path="/profile" element={<RoleRoute userElement={<Profile />} adminElement={<AdminProfile />} />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/community/create" element={<CreateCommunity />} />
        <Route path="/community/join" element={<JoinCommunity />} />
        <Route path="/community/:id" element={<CommunityProfile />} />
        <Route path="/users/:id" element={<UserProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
