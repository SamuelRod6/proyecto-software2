package response

import (
	"encoding/json"
	"net/http"
)

type APIResponse struct {
	Status  string  `json:"status"`
	Code    AppCode `json:"code"`
	Message string  `json:"message"`
	Payload any     `json:"payload,omitempty"`
}

func WriteJSON(w http.ResponseWriter, httpStatus int, appCode AppCode, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)

	status := "success"
	if httpStatus >= 400 {
		status = "error"
	}

	response := APIResponse{
		Status:  status,
		Code:    appCode,
		Message: appCode.GetMessage(),
		Payload: payload,
	}

	_ = json.NewEncoder(w).Encode(response)
}

func WriteError(w http.ResponseWriter, httpStatus int, appCode AppCode) {
	WriteJSON(w, httpStatus, appCode, nil)
}

func WriteSuccess(w http.ResponseWriter, httpStatus int, appCode AppCode, data any) {
	WriteJSON(w, httpStatus, appCode, data)
}
