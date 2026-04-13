package smtp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type SendEmailRequest struct {
	ToEmail string `json:"toEmail"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html,omitempty"`
	CCEmail string `json:"ccEmail,omitempty"`
}

type SendEmailResponse struct {
	StatusCode int             `json:"statusCode"`
	Body       json.RawMessage `json:"body"`
}

type mailerAPIRequest struct {
	From    string `json:"from"`
	To      string `json:"to"`
	CC      string `json:"cc,omitempty"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html"`
}

func SendEmail(ctx context.Context, input SendEmailRequest) (*SendEmailResponse, error) {
	url := strings.TrimSpace(os.Getenv("MAILER_API_URL"))
	if url == "" {
		return nil, fmt.Errorf("MAILER_API_URL is not set")
	}

	fromEmail := strings.TrimSpace(os.Getenv("MAILER_FROM"))
	if fromEmail == "" {
		return nil, fmt.Errorf("MAILER_FROM is not set")
	}

	authKey := strings.TrimSpace(os.Getenv("MAILER_API_AUTH_KEY"))

	text := strings.TrimSpace(input.Text)
	htmlBody := strings.TrimSpace(input.HTML)
	if text == "" && htmlBody == "" {
		return nil, fmt.Errorf("email body is empty")
	}
	if htmlBody == "" {
		htmlBody = textToHTML(text)
	}
	if text == "" {
		text = htmlBody
	}

	payloadBody := mailerAPIRequest{
		From:    fromEmail,
		To:      strings.TrimSpace(strings.ToLower(input.ToEmail)),
		CC:      resolveCC(strings.TrimSpace(strings.ToLower(input.CCEmail))),
		Subject: strings.TrimSpace(input.Subject),
		Text:    text,
		HTML:    htmlBody,
	}

	payloadBytes, err := json.Marshal(payloadBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: resolveTimeout()}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	if authKey != "" {
		req.Header.Set("Authorization", authKey)
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("mailer api error: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(body)))
	}

	return &SendEmailResponse{
		StatusCode: res.StatusCode,
		Body:       json.RawMessage(body),
	}, nil
}

func resolveCC(requestCC string) string {
	if requestCC != "" {
		return requestCC
	}
	return strings.TrimSpace(strings.ToLower(os.Getenv("MAILER_DEFAULT_CC")))
}

func resolveTimeout() time.Duration {
	timeoutSeconds := strings.TrimSpace(os.Getenv("MAILER_TIMEOUT_SECONDS"))
	if timeoutSeconds == "" {
		return 10 * time.Second
	}
	seconds, err := strconv.Atoi(timeoutSeconds)
	if err != nil || seconds <= 0 {
		return 10 * time.Second
	}
	return time.Duration(seconds) * time.Second
}

func textToHTML(input string) string {
	escaped := html.EscapeString(input)
	return strings.ReplaceAll(escaped, "\n", "<br/>")
}