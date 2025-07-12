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
import { AuthDialog } from "./components/AuthDialog";

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      runningTaskCount: 0,
      isFetching: false,
      repoDescription: "",
      isRepositoryConnected: false,
      useRepositoryAuth: false,
      showAuthDialog: false,
    };

    this.fetchTaskSummary = this.fetchTaskSummary.bind(this);
    this.repositoryUpdated = this.repositoryUpdated.bind(this);
    this.repositoryDescriptionUpdated = this.repositoryDescriptionUpdated.bind(this);
    this.fetchInitialRepositoryDescription = this.fetchInitialRepositoryDescription.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthSuccess = this.handleAuthSuccess.bind(this);
    this.handleAuthCancel = this.handleAuthCancel.bind(this);

    const tok = document.head.querySelector('meta[name="kopia-csrf-token"]');
    if (tok && tok.content) {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = tok.content;
    } else {
      axios.defaults.headers.common["X-Kopia-Csrf-Token"] = "-";
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

  logout() {
    console.log("Logout button clicked");
    console.log("Current state before logout:", this.state);
    
    axios
      .post("/api/v1/logout", {})
      .then((_result) => {
        console.log("Logout API call successful");
        
        // Clear any client-side state
        this.setState({
          isRepositoryConnected: false,
          useRepositoryAuth: false,
          repoDescription: "",
        });
        
        console.log("State cleared, clearing storage...");
        
        // Clear any cached data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear axios headers that might contain authentication info
        delete axios.defaults.headers.common["X-Kopia-Csrf-Token"];
        delete axios.defaults.headers.common["Authorization"];
        delete axios.defaults.headers.common["Cookie"];
        
        // Clear any other potential authentication headers
        delete axios.defaults.headers.common["X-Requested-With"];
        delete axios.defaults.headers.common["Accept"];
        
        console.log("Storage cleared, showing auth dialog...");
        
        // Show the custom authentication dialog
        this.setState({ showAuthDialog: true });
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        console.error("Error details:", error.response?.data);
        
        // Still clear state and show auth dialog even if logout fails
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear axios headers
        delete axios.defaults.headers.common["X-Kopia-Csrf-Token"];
        delete axios.defaults.headers.common["Authorization"];
        delete axios.defaults.headers.common["Cookie"];
        delete axios.defaults.headers.common["X-Requested-With"];
        delete axios.defaults.headers.common["Accept"];
        
        this.setState({ showAuthDialog: true });
      });
  }

  handleAuthSuccess(username, password) {
    console.log("Authentication successful for user:", username);
    
    // Update axios defaults with new credentials
    const authHeader = "Basic " + btoa(username + ":" + password);
    axios.defaults.headers.common["Authorization"] = authHeader;
    
    // Close the auth dialog
    this.setState({ showAuthDialog: false });
    
    // Refresh the page to reload with new credentials
    window.location.reload();
  }

  handleAuthCancel() {
    console.log("Authentication cancelled");
    
    // Close the auth dialog
    this.setState({ showAuthDialog: false });
    
    // Redirect to login page or show error
    window.location.href = "/";
  }

  render() {
    const { uiPrefs, runningTaskCount, isRepositoryConnected } = this.state;

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
                {this.state.useRepositoryAuth && (
                  <Nav>
                    <Button
                      data-testid="logout-button"
                      size="sm"
                      variant="primary"
                      onClick={this.logout}
                    >
                      Logout
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
            
            {/* Custom Authentication Dialog */}
            <AuthDialog
              show={this.state.showAuthDialog}
              onSuccess={this.handleAuthSuccess}
              onCancel={this.handleAuthCancel}
            />
          </UIPreferenceProvider>
        </AppContext.Provider>
      </Router>
    );
  }
}
