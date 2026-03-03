package dto

import "time"

type NotificationResponse struct {
    ID        int       `json:"id"`
    UserID    int       `json:"user_id"`
    EventID   *int      `json:"event_id,omitempty"`
    Type      string    `json:"type"`
    Title     string    `json:"title"`
    Message   string    `json:"message"`
    Read      bool      `json:"read"`
    CreatedAt time.Time `json:"created_at"`
}