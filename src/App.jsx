import "bootstrap/dist/css/bootstrap.min.css";
import "./css/Theme.css";
import "./css/App.css";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { BrowserRouter as Router, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Policy } from "./pages/Policy";
import { Preferences } from "./pages/Preferences";
import { Policies } from "./pages/Policies";
import { Repository } from "./pages/Repository";
import { Task } from "./pages/Task";
import { Tasks } from "./pages/Tasks";
import { Snapshots } from "./pages/Snapshots";
import { SnapshotCreate } from "./pages/SnapshotCreate";
import { SnapshotDirectory } from "./pages/SnapshotDirectory";
import { SnapshotHistory } from "./pages/SnapshotHistory";
import { SnapshotRestore } from "./pages/SnapshotRestore";
import { AppContext } from "./contexts/AppContext";
import { UIPreferenceProvider } from "./contexts/UIPreferencesContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";

// Main AppContent with Auth logic
const AppContent = () => {
  const [runningTaskCount, setRunningTaskCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [repoDescription, setRepoDescription] = useState("");
  const [isRepositoryConnected, setIsRepositoryConnected] = useState(false);
  const [useRepositoryAuth, setUseRepositoryAuth] = useState(undefined);
  const taskSummaryInterval = useRef(null);
  const { isAuthenticated, credentials, logout, setAuthHeader, clearAuthHeader } = useAuth();

  // Set up CSRF token
  useEffect(() => {
    const tok = document.head.querySelector('meta[name="kopia-csrf-token"]');
    if (tok && tok.content) {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = tok.content;
    } else {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = "-";
    }
  }, []);

  // Set up authentication headers when credentials change
  useEffect(() => {
    if (isAuthenticated && credentials) {
      setAuthHeader(axios);
    } else {
      clearAuthHeader(axios);
    }
  }, [isAuthenticated, credentials, setAuthHeader, clearAuthHeader]);

  // Component mount effects
  useEffect(() => {
    const av = document.getElementById("appVersion");
    if (av) {
      av.style.display = "block";
    }

    fetchInitialRepositoryDescription();
    taskSummaryInterval.current = window.setInterval(fetchTaskSummary, 5000);

    return () => {
      if (taskSummaryInterval.current) {
        window.clearInterval(taskSummaryInterval.current);
      }
    };
  }, []);

  const fetchInitialRepositoryDescription = () => {
    axios
      .get("/api/v1/repo/status")
      .then((result) => {
        if (result.data.description) {
          setRepoDescription(result.data.description);
          setIsRepositoryConnected(result.data.connected);
        }
        // Check if server is using repository auth
        setUseRepositoryAuth(result.data.useRepositoryAuth);
      })
      .catch((_) => {
        /* ignore */
      });
  };

  const fetchTaskSummary = () => {
    if (!isFetching) {
      setIsFetching(true);
      axios
        .get("/api/v1/tasks-summary")
        .then((result) => {
          setIsFetching(false);
          setRunningTaskCount(result.data["RUNNING"] || 0);
        })
        .catch((_) => {
          setIsFetching(false);
          setRunningTaskCount(-1);
        });
    }
  };

  const repositoryUpdated = (isConnected) => {
    setIsRepositoryConnected(isConnected);
    if (isConnected) {
      window.location.replace("/snapshots");
    } else {
      window.location.replace("/repo");
    }
  };

  const repositoryDescriptionUpdated = (desc) => {
    setRepoDescription(desc);
  };

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to clear server-side cookies
      await axios.post("/api/v1/logout");
    } catch (error) {
      console.warn("Backend logout failed:", error);
    }
    
    // Clear frontend auth state
    logout();
    // Redirect to login or home
    window.location.replace("/");
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <Login useRepositoryAuth={useRepositoryAuth} />;
  }

  return (
    <AppContext.Provider value={{ repositoryUpdated, repositoryDescriptionUpdated }}>
      <UIPreferenceProvider>
        <Navbar expand="sm" variant="light">
          <Navbar.Brand href="/">
            <img src="/kopia-flat.svg" className="App-logo" alt="logo" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <span className="d-inline-block" data-toggle="tooltip" title="Repository is not connected">
                <NavLink
                  data-testid="tab-snapshots"
                  title=""
                  data-title="Snapshots"
                  className={isRepositoryConnected ? "nav-link" : "nav-link disabled"}
                  to="/snapshots"
                >
                  Snapshots
                </NavLink>
              </span>
              <span className="d-inline-block" data-toggle="tooltip" title="Repository is not connected">
                <NavLink
                  data-testid="tab-policies"
                  title=""
                  data-title="Policies"
                  className={isRepositoryConnected ? "nav-link" : "nav-link disabled"}
                  to="/policies"
                >
                  Policies
                </NavLink>
              </span>
              <span className="d-inline-block" data-toggle="tooltip" title="Repository is not connected">
                <NavLink
                  data-testid="tab-tasks"
                  title=""
                  data-title="Tasks"
                  className={isRepositoryConnected ? "nav-link" : "nav-link disabled"}
                  to="/tasks"
                >
                  Tasks
                  <>{runningTaskCount > 0 && <>({runningTaskCount})</>}</>
                </NavLink>
              </span>
              <NavLink data-testid="tab-repo" data-title="Repository" className="nav-link" to="/repo">
                Repository
              </NavLink>
              <NavLink
                data-testid="tab-preferences"
                data-title="Preferences"
                className="nav-link"
                to="/preferences"
              >
                Preferences
              </NavLink>
            </Nav>
            <Nav>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleLogout}
                className="me-2"
              >
                Logout ({credentials?.username})
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Container fluid>
          <NavLink to="/repo" style={{ color: "inherit", textDecoration: "inherit" }}>
            <h5 className="mb-4">{repoDescription}</h5>
          </NavLink>

          <Routes>
            <Route path="snapshots" element={<Snapshots />} />
            <Route path="snapshots/new" element={<SnapshotCreate />} />
            <Route path="snapshots/single-source/" element={<SnapshotHistory />} />
            <Route path="snapshots/dir/:oid/restore" element={<SnapshotRestore />} />
            <Route path="snapshots/dir/:oid" element={<SnapshotDirectory />} />
            <Route path="policies/edit/" element={<Policy />} />
            <Route path="policies" element={<Policies />} />
            <Route path="tasks/:tid" element={<Task />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="repo" element={<Repository />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="/" element={<Navigate to="/snapshots" />} />
          </Routes>
        </Container>
      </UIPreferenceProvider>
    </AppContext.Provider>
  );
};

// App wrapper that always uses AuthProvider
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
