package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

const recoveryAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func GenerateTemporaryKey(length int) (string, error) {
	if length < 6 {
		return "", fmt.Errorf("length must be at least 6")
	}

	raw := make([]byte, length)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}

	buf := make([]byte, length)
	for i, b := range raw {
		buf[i] = recoveryAlphabet[int(b)%len(recoveryAlphabet)]
	}

	return string(buf), nil
}

func NormalizeTemporaryKey(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func HashTemporaryKey(value string) string {
	sum := sha256.Sum256([]byte(NormalizeTemporaryKey(value)))
	return hex.EncodeToString(sum[:])
}
