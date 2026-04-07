/*
File: requests.go

Contains:
Request DTO definitions for the notifications module.
It centralizes payload structures used to create and update notifications.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// CreateNotificationRequest represents payload to create a notification.
type CreateNotificationRequest struct {
    UserID  int    `json:"user_id"`
    EventID *int   `json:"event_id,omitempty"`
    Type    string `json:"type"`
    Message string `json:"message"`
}

// MarkAsReadRequest represents payload to change read state.
type MarkAsReadRequest struct {
    Read bool `json:"read"`
}