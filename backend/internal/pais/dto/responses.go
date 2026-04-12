/*
File: responses.go

Contains:
Response DTO definitions for the Pais module.
It centralizes API payload structures for countries and cities.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// PaisResponse represents one country in API responses.
type PaisResponse struct {
	ID     int    `json:"id_pais"`
	Nombre string `json:"nombre"`
}

// CiudadResponse represents one city in API responses.
type CiudadResponse struct {
	ID     int    `json:"id_ciudad"`
	Nombre string `json:"nombre"`
	PaisID int    `json:"id_pais"`
}
