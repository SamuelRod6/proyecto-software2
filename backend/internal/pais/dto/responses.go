package dto

type PaisResponse struct {
	ID     int    `json:"id_pais"`
	Nombre string `json:"nombre"`
}

type CiudadResponse struct {
	ID     int    `json:"id_ciudad"`
	Nombre string `json:"nombre"`
	PaisID int    `json:"id_pais"`
}
