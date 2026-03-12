package afip

// WSAA (Web Service de Autenticación y Autorización)
// This is a skeleton implementation. Real AFIP integration requires:
// 1. A valid certificate (.crt) and private key (.key) from AFIP
// 2. CMS/PKCS#7 signing of the TRA (Login Ticket Request)
// 3. SOAP call to WSAA loginCms endpoint

const (
	WSAATestingURL    = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms"
	WSAAProductionURL = "https://wsaa.afip.gov.ar/ws/services/LoginCms"
	WSFETestingURL    = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
	WSFEProductionURL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
)

func GetWSAAURL(modo string) string {
	if modo == "PRODUCCION" {
		return WSAAProductionURL
	}
	return WSAATestingURL
}

func GetWSFEURL(modo string) string {
	if modo == "PRODUCCION" {
		return WSFEProductionURL
	}
	return WSFETestingURL
}
