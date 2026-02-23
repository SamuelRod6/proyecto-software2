package dto

import "time"

type EventFilters struct {
	SearchTerm  string
	CountryTerm string
	CityTerm    string
	FromDate    *time.Time
	ToDate      *time.Time
}
