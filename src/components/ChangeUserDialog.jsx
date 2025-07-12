import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import PropTypes from "prop-types";
import { handleChange } from "../forms";

export class ChangeUserDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      isSubmitting: false,
      error: null,
    };

    this.handleChange = handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    
    // Allow empty credentials for logout
    if (this.state.username === "" && this.state.password === "") {
      this.setState({ isSubmitting: true, error: null });
      
      // Call the change-user API with empty credentials
      fetch("/api/v1/change-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kopia-Csrf-Token": window.axios?.defaults?.headers?.common?.["X-Kopia-Csrf-Token"] || "-",
        },
        body: JSON.stringify({
          username: "",
          password: "",
        }),
      })
      .then(response => {
        if (response.ok) {
          // Clear stored credentials
          localStorage.removeItem("kopia_auth_encoded");
          
          // Clear axios headers
          if (window.axios) {
            delete window.axios.defaults.headers.common["X-Kopia-User"];
            delete window.axios.defaults.headers.common["X-Kopia-Password"];
            delete window.axios.defaults.headers.common["Authorization"];
          }
          
          this.setState({ isSubmitting: false });
          this.props.onSuccess("", "");
        } else {
          return response.json().then(data => {
            throw new Error(data.error || "Failed to logout");
          });
        }
      })
      .catch(error => {
        this.setState({ 
          isSubmitting: false, 
          error: error.message || "Failed to logout. Please try again." 
        });
      });
      return;
    }
    
    if (!this.state.username || !this.state.password) {
      this.setState({ error: "Please enter both username and password" });
      return;
    }

    this.setState({ isSubmitting: true, error: null });

    // Call the change-user API
    fetch("/api/v1/change-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kopia-Csrf-Token": window.axios?.defaults?.headers?.common?.["X-Kopia-Csrf-Token"] || "-",
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
      }),
    })
    .then(response => {
      if (response.ok) {
        // Success - store credentials for future requests
        const authHeader = "Basic " + btoa(this.state.username + ":" + this.state.password);
        
        // Update axios defaults for future requests
        if (window.axios) {
          window.axios.defaults.headers.common["Authorization"] = authHeader;
        }
        
        // Store credentials in localStorage for persistence
        localStorage.setItem("kopia_auth_encoded", btoa(this.state.username + ":" + this.state.password));
        
        this.setState({ isSubmitting: false });
        this.props.onSuccess(this.state.username, this.state.password);
      } else {
        return response.json().then(data => {
          throw new Error(data.error || "Failed to change user");
        });
      }
    })
    .catch(error => {
      this.setState({ 
        isSubmitting: false, 
        error: error.message || "Failed to change user. Please try again." 
      });
    });
  }

  handleCancel() {
    this.props.onCancel();
  }

  render() {
    return (
      <Modal show={this.props.show} onHide={this.handleCancel} backdrop="static" keyboard={false}>
        <Modal.Header closeButton={false}>
          <Modal.Title>Change User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter credentials for the new user, or leave empty to logout:</p>
          <Form onSubmit={this.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={this.state.username}
                onChange={this.handleChange}
                placeholder="Enter username (empty to logout)"
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={this.state.password}
                onChange={this.handleChange}
                placeholder="Enter password (empty to logout)"
              />
            </Form.Group>
            {this.state.error && (
              <div className="alert alert-danger" role="alert">
                {this.state.error}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleCancel}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={this.handleSubmit}
            disabled={this.state.isSubmitting}
          >
            {this.state.isSubmitting ? "Processing..." : (this.state.username === "" && this.state.password === "" ? "Logout" : "Change User")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

ChangeUserDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}; 