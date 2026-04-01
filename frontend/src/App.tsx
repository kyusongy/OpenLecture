import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CourseDetail from "./pages/CourseDetail";
import LiveLecture from "./pages/LiveLecture";
import LectureDetail from "./pages/LectureDetail";
import Settings from "./pages/Settings";
import SetupPage from "./pages/SetupPage";

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/live" element={<LiveLecture />} />
        <Route path="/lectures/:lectureId" element={<LectureDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
