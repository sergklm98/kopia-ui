import "bootstrap/dist/css/bootstrap.min.css";
import "./css/Theme.css";
import "./css/App.css";
import axios from "axios";
import { React, Component } from "react";
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
import { ChangeUserDialog } from "./components/ChangeUserDialog";

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      runningTaskCount: 0,
      isFetching: false,
      repoDescription: "",
      isRepositoryConnected: false,
      useRepositoryAuth: false,
      showChangeUserDialog: false,
    };

    this.fetchTaskSummary = this.fetchTaskSummary.bind(this);
    this.repositoryUpdated = this.repositoryUpdated.bind(this);
    this.repositoryDescriptionUpdated = this.repositoryDescriptionUpdated.bind(this);
    this.fetchInitialRepositoryDescription = this.fetchInitialRepositoryDescription.bind(this);
    this.handleChangeUser = this.handleChangeUser.bind(this);
    this.handleChangeUserSuccess = this.handleChangeUserSuccess.bind(this);
    this.handleChangeUserCancel = this.handleChangeUserCancel.bind(this);

    const tok = document.head.querySelector('meta[name="kopia-csrf-token"]');
    if (tok && tok.content) {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = tok.content;
    } else {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = "-";
    }

    // Make axios available globally for the ChangeUserDialog
    window.axios = axios;

    // Restore stored credentials if available
    const storedCredentials = localStorage.getItem("kopia_auth_encoded");
    if (storedCredentials) {
      try {
        const decoded = atob(storedCredentials);
        const [username, password] = decoded.split(":");
        if (username && password) {
          axios.defaults.headers.common["X-Kopia-User"] = username;
          axios.defaults.headers.common["X-Kopia-Password"] = password;
        }
      } catch {
        // Invalid stored credentials, clear them
        localStorage.removeItem("kopia_auth_encoded");
      }
    }
  }

  componentDidMount() {
    const av = document.getElementById("appVersion");
    if (av) {
      // show app version after mounting the component to avoid flashing of unstyled content.
      av.style.display = "block";
    }

    this.fetchInitialRepositoryDescription();
    this.taskSummaryInterval = window.setInterval(this.fetchTaskSummary, 5000);
  }

  fetchInitialRepositoryDescription() {
    axios
      .get("/api/v1/repo/status")
      .then((result) => {
        if (result.data.description) {
          this.setState({
            repoDescription: result.data.description,
            isRepositoryConnected: result.data.connected,
            useRepositoryAuth: result.data.useRepositoryAuth || false,
          });
        }
      })
      .catch((_) => {
        /* ignore */
      });
  }

  fetchTaskSummary() {
    if (!this.state.isFetching) {
      this.setState({ isFetching: true });
      axios
        .get("/api/v1/tasks-summary")
        .then((result) => {
          this.setState({
            isFetching: false,
            runningTaskCount: result.data["RUNNING"] || 0,
          });
        })
        .catch((_) => {
          this.setState({ isFetching: false, runningTaskCount: -1 });
        });
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.taskSummaryInterval);
  }

  // this is invoked via AppContext whenever repository is connected, disconnected, etc.
  repositoryUpdated(isConnected) {
    this.setState({ isRepositoryConnected: isConnected });
    if (isConnected) {
      window.location.replace("/snapshots");
    } else {
      window.location.replace("/repo");
    }
  }

  repositoryDescriptionUpdated(desc) {
    this.setState({
      repoDescription: desc,
    });
  }

  handleChangeUser() {
    this.setState({ showChangeUserDialog: true });
  }

  handleChangeUserSuccess(username, password) {
    if (username === "" && password === "") {
      // Logout case - clear custom headers and refresh
      delete axios.defaults.headers.common["X-Kopia-User"];
      delete axios.defaults.headers.common["X-Kopia-Password"];
      delete axios.defaults.headers.common["Authorization"];
      
      // Clear stored credentials
      localStorage.removeItem("kopia_auth_encoded");
      
      // Close the dialog
      this.setState({ showChangeUserDialog: false });
      
      // Refresh the page to reload without credentials
      window.location.reload();
    } else {
      // Set custom headers for future requests
      axios.defaults.headers.common["X-Kopia-User"] = username;
      axios.defaults.headers.common["X-Kopia-Password"] = password;
      
      // Store encoded credentials
      localStorage.setItem("kopia_auth_encoded", btoa(username + ":" + password));
      
      // Close the dialog
      this.setState({ showChangeUserDialog: false });
      
      // Refresh the page to reload with new credentials
      window.location.reload();
    }
  }

  handleChangeUserCancel() {
    this.setState({ showChangeUserDialog: false });
  }

  render() {
    const { uiPrefs, runningTaskCount, isRepositoryConnected, useRepositoryAuth } = this.state;

    return (
      <Router>
        <AppContext.Provider value={this}>
          <UIPreferenceProvider initalValue={uiPrefs}>
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
                {useRepositoryAuth && (
                  <Nav>
                    <Button
                      data-testid="change-user-button"
                      size="sm"
                      variant="outline-primary"
                      onClick={this.handleChangeUser}
                    >
                      Change User
                    </Button>
                  </Nav>
                )}
              </Navbar.Collapse>
            </Navbar>

            <Container fluid>
              <NavLink to="/repo" style={{ color: "inherit", textDecoration: "inherit" }}>
                <h5 className="mb-4">{this.state.repoDescription}</h5>
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
            
            {/* Change User Dialog */}
            <ChangeUserDialog
              show={this.state.showChangeUserDialog}
              onSuccess={this.handleChangeUserSuccess}
              onCancel={this.handleChangeUserCancel}
            />
          </UIPreferenceProvider>
        </AppContext.Provider>
      </Router>
    );
  }
}
