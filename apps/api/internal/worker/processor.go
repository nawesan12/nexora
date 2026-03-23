package worker

import (
	"github.com/hibiken/asynq"
	"github.com/rs/zerolog/log"
)

func NewProcessor(redisURL string) *asynq.Server {
	redisOpt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse redis URL for asynq")
	}

	srv := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: 5,
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)

	return srv
}

func RegisterHandlers(mux *asynq.ServeMux, ew *EmailWorker) {
	mux.HandleFunc(TaskSendEmail, ew.HandleSendEmail)
	mux.HandleFunc(TaskSendPasswordReset, ew.HandleSendEmail)
	mux.HandleFunc(TaskSendEmailVerification, ew.HandleSendEmail)
	mux.HandleFunc(TaskSendOrderNotification, ew.HandleSendEmail)
}
