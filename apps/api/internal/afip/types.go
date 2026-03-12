package afip

import "encoding/xml"

// WSAA types
type LoginTicketRequest struct {
	XMLName xml.Name  `xml:"loginTicketRequest"`
	Header  TRAHeader `xml:"header"`
	Service string    `xml:"service"`
}

type TRAHeader struct {
	UniqueId       int64  `xml:"uniqueId"`
	GenerationTime string `xml:"generationTime"`
	ExpirationTime string `xml:"expirationTime"`
}

type LoginTicketResponse struct {
	XMLName     xml.Name    `xml:"loginTicketResponse"`
	Credentials Credentials `xml:"credentials"`
}

type Credentials struct {
	Token string `xml:"token"`
	Sign  string `xml:"sign"`
}

// WSFE types
type FECAERequest struct {
	FeCabReq FECabRequest `json:"FeCabReq"`
	FeDetReq FEDetRequest `json:"FeDetReq"`
}

type FECabRequest struct {
	CantReg  int `json:"CantReg"`
	PtoVta   int `json:"PtoVta"`
	CbteTipo int `json:"CbteTipo"`
}

type FEDetRequest struct {
	FECAEDetRequest []FECAEDetRequest `json:"FECAEDetRequest"`
}

type FECAEDetRequest struct {
	Concepto   int       `json:"Concepto"`
	DocTipo    int       `json:"DocTipo"`
	DocNro     int64     `json:"DocNro"`
	CbteDesde  int64     `json:"CbteDesde"`
	CbteHasta  int64     `json:"CbteHasta"`
	CbteFch    string    `json:"CbteFch"`
	ImpTotal   float64   `json:"ImpTotal"`
	ImpTotConc float64   `json:"ImpTotConc"`
	ImpNeto    float64   `json:"ImpNeto"`
	ImpOpEx    float64   `json:"ImpOpEx"`
	ImpIVA     float64   `json:"ImpIVA"`
	ImpTrib    float64   `json:"ImpTrib"`
	MonId      string    `json:"MonId"`
	MonCotiz   float64   `json:"MonCotiz"`
	Iva        []AlicIVA `json:"Iva,omitempty"`
}

type AlicIVA struct {
	Id      int     `json:"Id"`
	BaseImp float64 `json:"BaseImp"`
	Importe float64 `json:"Importe"`
}

type FECAEResponse struct {
	FeCabResp FECabResponse `json:"FeCabResp"`
	FeDetResp FEDetResponse `json:"FeDetResp"`
	Errors    []WSError     `json:"Errors,omitempty"`
}

type FECabResponse struct {
	Resultado string `json:"Resultado"`
	PtoVta    int    `json:"PtoVta"`
	CbteTipo  int    `json:"CbteTipo"`
}

type FEDetResponse struct {
	FECAEDetResponse []FECAEDetResponse `json:"FECAEDetResponse"`
}

type FECAEDetResponse struct {
	CAE           string          `json:"CAE"`
	CAEFchVto     string          `json:"CAEFchVto"`
	Resultado     string          `json:"Resultado"`
	CbteDesde     int64           `json:"CbteDesde"`
	CbteHasta     int64           `json:"CbteHasta"`
	Observaciones []WSObservacion `json:"Observaciones,omitempty"`
}

type WSError struct {
	Code int    `json:"Code"`
	Msg  string `json:"Msg"`
}

type WSObservacion struct {
	Code int    `json:"Code"`
	Msg  string `json:"Msg"`
}

type FECompUltimoAutorizadoResponse struct {
	CbteNro int64 `json:"CbteNro"`
}

// AFIP tipo mapping
var TipoComprobanteAFIP = map[string]int{
	"FACTURA_A":      1,
	"FACTURA_B":      6,
	"FACTURA_C":      11,
	"NOTA_DEBITO_A":  2,
	"NOTA_DEBITO_B":  7,
	"NOTA_CREDITO_A": 3,
	"NOTA_CREDITO_B": 8,
}

func GetTipoAFIP(tipo, letra string) int {
	key := tipo + "_" + letra
	if v, ok := TipoComprobanteAFIP[key]; ok {
		return v
	}
	return 0
}
