package afip

import "errors"

var (
	ErrAFIPAuth     = errors.New("AFIP authentication failed")
	ErrAFIPRejected = errors.New("AFIP rejected the invoice")
	ErrAFIPTimeout  = errors.New("AFIP service timeout")
	ErrAFIPNoConfig = errors.New("AFIP configuration not found or inactive")
	ErrAFIPNoCert   = errors.New("AFIP certificate or private key not configured")
)
