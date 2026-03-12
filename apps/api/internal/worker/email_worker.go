package worker

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog/log"
)

type EmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func HandleSendEmail(_ context.Context, t *asynq.Task) error {
	var payload EmailPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return err
	}

	log.Info().
		Str("to", payload.To).
		Str("subject", payload.Subject).
		Msg("email task processed (placeholder)")

	return nil
}
