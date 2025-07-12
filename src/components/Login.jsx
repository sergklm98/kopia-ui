import React from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import PropTypes from "prop-types";

export const Login = ({ useRepositoryAuth }) => {
  const { login } = useAuth();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Test the credentials by making a simple API call
      const axios = (await import("axios")).default;
      const authString = btoa(`${username}:${password}`);
      
      const response = await axios.get("/api/v1/repo/status", {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      });

      if (response.status === 200) {
        // Credentials are valid, proceed with login
        login(username, password);
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If useRepositoryAuth is false, show a message about browser authentication
  if (useRepositoryAuth === false) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Header>
                <h4>Authentication Required</h4>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <strong>Browser Authentication Required</strong>
                  <br />
                  This server is configured to use browser-based authentication. 
                  Please enter your credentials in the browser&apos;s authentication dialog.
                  <br /><br />
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // If useRepositoryAuth is undefined (still loading), show loading
  if (useRepositoryAuth === undefined) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Body className="text-center">
                <div>Loading...</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Default login form for repository auth
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>Login</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </Form.Group>
                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isLoading}
                  className="w-100"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

Login.propTypes = {
  useRepositoryAuth: PropTypes.bool,
}; 