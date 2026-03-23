package worker

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"
	"github.com/pronto-erp/pronto/internal/email"
	"github.com/rs/zerolog/log"
)

type EmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

type EmailWorker struct {
	sender *email.Sender
}

func NewEmailWorker(sender *email.Sender) *EmailWorker {
	return &EmailWorker{sender: sender}
}

func (w *EmailWorker) HandleSendEmail(_ context.Context, t *asynq.Task) error {
	var payload EmailPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return err
	}

	if w.sender == nil {
		log.Warn().Str("to", payload.To).Str("subject", payload.Subject).Msg("email skipped: no email provider configured")
		return nil
	}

	log.Info().Str("to", payload.To).Str("subject", payload.Subject).Msg("sending email")

	if err := w.sender.Send(payload.To, payload.Subject, payload.Body); err != nil {
		log.Error().Err(err).Str("to", payload.To).Msg("failed to send email")
		return err
	}

	log.Info().Str("to", payload.To).Msg("email sent successfully")
	return nil
}
