import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Timetable from "./pages/Timetable";
import Tasks from "./pages/Tasks";
import Notes from "./pages/Notes";
import Projects from "./pages/Projects";
import Courses from "./pages/Courses";
import ExamPapers from "./pages/ExamPapers";
import Resources from "./pages/Resources";
import Search from "./pages/Search";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="notes" element={<Notes />} />
          <Route path="projects" element={<Projects />} />
          <Route path="courses" element={<Courses />} />
          <Route path="exams" element={<ExamPapers />} />
          <Route path="resources" element={<Resources />} />
          <Route path="search" element={<Search />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
