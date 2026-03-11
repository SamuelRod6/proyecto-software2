package smtp

import (
	"encoding/json"
	"net/http"
	"strings"

	"project/backend/internal/shared/response"
)

func SandboxEmailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req SandboxSendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	req.ToEmail = strings.TrimSpace(strings.ToLower(req.ToEmail))
	req.Subject = strings.TrimSpace(req.Subject)
	req.Text = strings.TrimSpace(req.Text)

	if req.ToEmail == "" || req.Subject == "" || req.Text == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	result, err := SendSandboxEmail(r.Context(), req)
	if err != nil {
		response.WriteError(w, http.StatusBadGateway, response.ErrInternalServer)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, result)
}
