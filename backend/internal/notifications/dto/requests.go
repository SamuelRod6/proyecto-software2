package dto

type CreateNotificationRequest struct {
    UserID  int    `json:"user_id"`
    EventID *int   `json:"event_id,omitempty"`
    Type    string `json:"type"`
    Message string `json:"message"`
}

type MarkAsReadRequest struct {
    Read bool `json:"read"`
}