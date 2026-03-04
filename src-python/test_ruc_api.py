
import sys
import os
sys.path.append(r'c:\Users\Fredy\Desktop\PROJECTO\sunat-app\src-python')
from ruc_api import consultar_ruc
import json

test_ruc = "20100130204" # RUC de SUNAT
print(f"Probando RUC: {test_ruc}")
result = consultar_ruc(test_ruc)
print(json.dumps(result, indent=2))
