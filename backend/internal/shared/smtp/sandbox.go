package smtp

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type SandboxSendRequest struct {
	ToEmail string `json:"toEmail"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
}

type SandboxSendResponse struct {
	StatusCode int             `json:"statusCode"`
	Body       json.RawMessage `json:"body"`
}

func SendSandboxEmail(ctx context.Context, input SandboxSendRequest) (*SandboxSendResponse, error) {
	url := strings.TrimSpace(os.Getenv("EMAIL_SANDBOX_URL"))
	if url == "" {
		return nil, fmt.Errorf("EMAIL_SANDBOX_URL is not set")
	}
	token := strings.TrimSpace(os.Getenv("EMAIL_SANDBOX_TOKEN"))
	if token == "" {
		return nil, fmt.Errorf("EMAIL_SANDBOX_TOKEN is not set")
	}

	payloadBody := map[string]any{
		"from": map[string]string{
			"email": "hello@example.com",
			"name":  "Mailtrap Test",
		},
		"to": []map[string]string{{
			"email": input.ToEmail,
		}},
		"subject":  input.Subject,
		"text":     input.Text,
		"category": "Integration Test",
	}

	payloadBytes, err := json.Marshal(payloadBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(payloadBytes)))
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+token)
	req.Header.Add("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	return &SandboxSendResponse{
		StatusCode: res.StatusCode,
		Body:       json.RawMessage(body),
	}, nil
}
