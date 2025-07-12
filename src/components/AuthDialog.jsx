import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import PropTypes from "prop-types";
import { handleChange } from "../forms";

export class AuthDialog extends Component {
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
    
    if (!this.state.username || !this.state.password) {
      this.setState({ error: "Please enter both username and password" });
      return;
    }

    this.setState({ isSubmitting: true, error: null });

    // Create Basic Auth header with new credentials
    const authHeader = "Basic " + btoa(this.state.username + ":" + this.state.password);
    
    // Test the credentials by making a request
    fetch("/api/v1/repo/status", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    })
    .then(response => {
      if (response.ok) {
        // Credentials are valid, update axios defaults and close dialog
        window.axios.defaults.headers.common["Authorization"] = authHeader;
        
        // Clear any old authentication state
        localStorage.removeItem("kopia_auth_username");
        localStorage.removeItem("kopia_auth_password");
        
        // Store new credentials (optional, for persistence)
        localStorage.setItem("kopia_auth_username", this.state.username);
        localStorage.setItem("kopia_auth_password", this.state.password);
        
        this.setState({ isSubmitting: false });
        this.props.onSuccess(this.state.username, this.state.password);
      } else {
        this.setState({ 
          isSubmitting: false, 
          error: "Invalid credentials. Please try again." 
        });
      }
    })
    .catch(_error => {
      this.setState({ 
        isSubmitting: false, 
        error: "Connection error. Please try again." 
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
          <Modal.Title>Authentication Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter your credentials to continue:</p>
          <Form onSubmit={this.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={this.state.username}
                onChange={this.handleChange}
                placeholder="Enter username"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={this.state.password}
                onChange={this.handleChange}
                placeholder="Enter password"
                required
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
            {this.state.isSubmitting ? "Authenticating..." : "Login"}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

AuthDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}; 