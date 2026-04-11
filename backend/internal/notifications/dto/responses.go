/*
File: responses.go

Contains:
Response DTO definitions for the notifications module.
It centralizes payload structures returned to API clients.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

import "time"

// NotificationResponse represents one notification returned by the API.
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