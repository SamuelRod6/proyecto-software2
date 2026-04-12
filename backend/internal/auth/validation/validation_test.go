package validation

import "testing"

func TestValidateUsername(t *testing.T) {
	cases := []struct {
		name  string
		value string
		ok    bool
	}{
		{"valid simple", "Juan Perez", true},
		{"too short", "Jo", false},
		{"has numbers", "Juan1", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := ValidateUsername(tc.value); got != tc.ok {
				t.Fatalf("ValidateUsername(%q)=%v want %v", tc.value, got, tc.ok)
			}
		})
	}
}

func TestValidateEmail(t *testing.T) {
	if !ValidateEmail("user@mail.com") {
		t.Fatal("expected valid email")
	}
	if ValidateEmail("user@mail") {
		t.Fatal("expected invalid email")
	}
}

func TestValidatePassword(t *testing.T) {
	if !ValidatePassword("Abcd1234") {
		t.Fatal("expected valid password")
	}
	if ValidatePassword("abcd1234") {
		t.Fatal("expected invalid password without uppercase")
	}
	if ValidatePassword("ABCD1234") {
		t.Fatal("expected invalid password without lowercase")
	}
	if ValidatePassword("Abcdefgh") {
		t.Fatal("expected invalid password without number")
	}
}
