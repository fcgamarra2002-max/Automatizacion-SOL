"""
Modelos de datos para la tabla Empresas.

SKILL: Definición de modelos de datos para la tabla Empresas en Access.
"""


class Empresa:
    """Modelo que representa una empresa en la tabla Access."""

    NAVEGADORES_VALIDOS = ("chrome", "edge", "firefox")
    PORTALES_VALIDOS = ("TRAMITES", "CONSULTAS", "RENTA_PERSONAS", "RENTA_EMPRESAS")
    MOTORES_VALIDOS = ("selenium", "playwright")

    def __init__(
        self,
        id: int = None,
        ruc: str = "",
        razon_social: str = "",
        usuario_sol: str = "",
        clave_sol: str = "",
        navegador: str = "chrome",
        tipo_portal: str = "TRAMITES",
        motor: str = "selenium",
    ):
        self.id = id
        self.ruc = ruc
        self.razon_social = razon_social
        self.usuario_sol = usuario_sol.upper()
        self.clave_sol = clave_sol
        self.navegador = navegador.lower()
        self.tipo_portal = tipo_portal.upper()
        self.motor = motor.lower()

    def validate(self) -> list[str]:
        """Validar campos de la empresa. Retorna lista de errores."""
        errors = []
        if not self.ruc or len(self.ruc) != 11 or not self.ruc.isdigit():
            errors.append("RUC debe tener exactamente 11 dígitos numéricos")
        if not self.razon_social:
            errors.append("RazonSocial es obligatorio")
        if not self.usuario_sol:
            errors.append("UsuarioSOL es obligatorio")
        # ClaveSOL es opcional en la validación base (se valida según el contexto en db_access.py)
        # if not self.clave_sol:
        #     errors.append("ClaveSOL es obligatoria")
        if self.navegador not in self.NAVEGADORES_VALIDOS:
            errors.append(f"Navegador debe ser uno de: {self.NAVEGADORES_VALIDOS}")
        if self.tipo_portal not in self.PORTALES_VALIDOS:
            errors.append(f"TipoPortal debe ser uno de: {self.PORTALES_VALIDOS}")
        if self.motor not in self.MOTORES_VALIDOS:
            errors.append(f"Motor debe ser uno de: {self.MOTORES_VALIDOS}")
        return errors

    def to_dict(self, include_clave: bool = False) -> dict:
        """
        Convertir a diccionario.
        SKILL: Buenas prácticas — por defecto NO incluye ClaveSOL.
        """
        data = {
            "Id": self.id,
            "RUC": self.ruc,
            "RazonSocial": self.razon_social,
            "UsuarioSOL": self.usuario_sol,
            "Navegador": self.navegador,
            "TipoPortal": self.tipo_portal,
            "Motor": self.motor,
        }
        if include_clave:
            data["ClaveSOL"] = self.clave_sol
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "Empresa":
        """Crear Empresa desde diccionario."""
        return cls(
            id=data.get("Id"),
            ruc=data.get("RUC", ""),
            razon_social=data.get("RazonSocial", ""),
            usuario_sol=data.get("UsuarioSOL", ""),
            clave_sol=data.get("ClaveSOL", ""),
            navegador=data.get("Navegador", "chrome"),
            tipo_portal=data.get("TipoPortal", "TRAMITES"),
            motor=data.get("Motor", "selenium"),
        )
